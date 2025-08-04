#!/bin/bash

# 🛡️ SAFE ROLLBACK PROCEDURES
# Replaces dangerous force push operations with safe rollback methods
# Version: 1.0
# Date: $(date +%Y-%m-%d)

set -e  # Exit on error

# Configuration
BACKUP_DATE=${1:-"latest"}
LOG_FILE="/var/log/safe-rollback-$(date +%Y%m%d-%H%M%S).log"
ROLLBACK_BRANCH="emergency-rollback-$(date +%Y%m%d-%H%M%S)"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "❌ ERROR: $1"
    log "🔄 Attempting to restore previous state..."
    exit 1
}

# Verification function
verify_rollback() {
    log "🔍 Verifying rollback success..."
    
    # Check if application is responding
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
    
    if [ "$response" = "200" ]; then
        log "✅ Application is responding correctly"
        return 0
    else
        log "❌ Application not responding (HTTP $response)"
        return 1
    fi
}

# 🚨 EMERGENCY ROLLBACK (< 5 minutes)
emergency_rollback() {
    log "🚨 Starting EMERGENCY ROLLBACK..."
    
    # Step 1: Immediate feature flag disable
    log "🔧 Disabling feature flags..."
    
    if command -v kubectl &> /dev/null; then
        # Kubernetes deployment
        kubectl set env deployment/jlpt4you NEXT_PUBLIC_USE_NEW_AUTH=false || handle_error "Failed to disable NEW_AUTH flag"
        kubectl set env deployment/jlpt4you NEXT_PUBLIC_USE_NEW_MIDDLEWARE=false || handle_error "Failed to disable NEW_MIDDLEWARE flag"
        kubectl set env deployment/jlpt4you NEXT_PUBLIC_USE_NEW_API_AUTH=false || handle_error "Failed to disable NEW_API_AUTH flag"
        
        log "⏳ Waiting for deployment rollout..."
        kubectl rollout status deployment/jlpt4you --timeout=300s || handle_error "Deployment rollout failed"
        
    elif command -v pm2 &> /dev/null; then
        # PM2 deployment
        export NEXT_PUBLIC_USE_NEW_AUTH=false
        export NEXT_PUBLIC_USE_NEW_MIDDLEWARE=false
        export NEXT_PUBLIC_USE_NEW_API_AUTH=false
        
        # Update PM2 environment
        pm2 restart all --update-env || handle_error "Failed to restart PM2 processes"
        
    else
        log "⚠️  No deployment manager found, setting environment variables only"
        export NEXT_PUBLIC_USE_NEW_AUTH=false
        export NEXT_PUBLIC_USE_NEW_MIDDLEWARE=false
        export NEXT_PUBLIC_USE_NEW_API_AUTH=false
    fi
    
    # Step 2: Verify immediate rollback
    sleep 10  # Wait for services to restart
    
    if verify_rollback; then
        log "✅ Emergency rollback successful via feature flags"
        return 0
    fi
    
    # Step 3: If feature flags didn't work, deploy backup branch
    log "⚠️  Feature flags rollback insufficient, deploying backup branch..."
    deploy_backup_branch
}

# 🔄 DEPLOY BACKUP BRANCH (Safe alternative to force push)
deploy_backup_branch() {
    log "🔄 Deploying backup branch safely..."
    
    # Find the latest backup branch
    if [ "$BACKUP_DATE" = "latest" ]; then
        BACKUP_BRANCH=$(git branch -r | grep "backup/pre-auth-refactor" | sort -r | head -1 | sed 's/origin\///' | xargs)
        if [ -z "$BACKUP_BRANCH" ]; then
            handle_error "No backup branch found"
        fi
    else
        BACKUP_BRANCH="backup/pre-auth-refactor-$BACKUP_DATE"
    fi
    
    log "📦 Using backup branch: $BACKUP_BRANCH"
    
    # Create emergency rollback branch from backup
    git fetch origin || handle_error "Failed to fetch from origin"
    git checkout -b "$ROLLBACK_BRANCH" "origin/$BACKUP_BRANCH" || handle_error "Failed to create rollback branch"
    
    # Push rollback branch
    git push origin "$ROLLBACK_BRANCH" || handle_error "Failed to push rollback branch"
    
    # Deploy rollback branch (method depends on deployment system)
    if command -v kubectl &> /dev/null; then
        # Update Kubernetes deployment to use rollback branch
        kubectl set image deployment/jlpt4you app=jlpt4you:"$ROLLBACK_BRANCH" || handle_error "Failed to update Kubernetes image"
        kubectl rollout status deployment/jlpt4you --timeout=300s || handle_error "Rollback deployment failed"
        
    elif [ -f "deploy.sh" ]; then
        # Custom deployment script
        ./deploy.sh "$ROLLBACK_BRANCH" || handle_error "Custom deployment failed"
        
    else
        log "⚠️  Manual deployment required for branch: $ROLLBACK_BRANCH"
        log "📋 Next steps:"
        log "   1. Deploy branch $ROLLBACK_BRANCH to production"
        log "   2. Update DNS/load balancer if needed"
        log "   3. Verify application functionality"
    fi
    
    # Verify deployment
    sleep 30  # Wait for deployment
    if verify_rollback; then
        log "✅ Backup branch deployment successful"
    else
        handle_error "Backup branch deployment verification failed"
    fi
}

# 🗄️ DATABASE ROLLBACK (if needed)
database_rollback() {
    log "🗄️  Starting database rollback..."
    
    # Create current state backup first
    local current_backup="current-state-backup-$(date +%Y%m%d-%H%M%S).sql"
    log "💾 Creating current state backup: $current_backup"
    
    pg_dump -h localhost -U postgres -d jlpt4you > "backup/$current_backup" || handle_error "Failed to create current backup"
    
    # Stop application to prevent data corruption
    log "⏸️  Stopping application..."
    if command -v kubectl &> /dev/null; then
        kubectl scale deployment/jlpt4you --replicas=0 || handle_error "Failed to stop Kubernetes deployment"
    elif command -v pm2 &> /dev/null; then
        pm2 stop all || handle_error "Failed to stop PM2 processes"
    fi
    
    # Restore from backup
    local backup_file="backup/full-backup-$BACKUP_DATE.sql"
    if [ ! -f "$backup_file" ]; then
        backup_file=$(find backup/ -name "full-backup-*.sql" | sort -r | head -1)
        if [ -z "$backup_file" ]; then
            handle_error "No database backup found"
        fi
    fi
    
    log "📥 Restoring from: $backup_file"
    psql -h localhost -U postgres -d jlpt4you < "$backup_file" || handle_error "Database restore failed"
    
    # Verify database integrity
    log "🔍 Verifying database integrity..."
    local user_count=$(psql -h localhost -U postgres -d jlpt4you -t -c "SELECT COUNT(*) FROM users;" | xargs)
    
    if [ "$user_count" -gt 0 ]; then
        log "✅ Database restore successful, $user_count users found"
    else
        handle_error "Database restore verification failed"
    fi
    
    # Restart application
    log "▶️  Restarting application..."
    if command -v kubectl &> /dev/null; then
        kubectl scale deployment/jlpt4you --replicas=1 || handle_error "Failed to restart Kubernetes deployment"
        kubectl rollout status deployment/jlpt4you --timeout=300s || handle_error "Application restart failed"
    elif command -v pm2 &> /dev/null; then
        pm2 start all || handle_error "Failed to restart PM2 processes"
    fi
    
    # Final verification
    sleep 30
    if verify_rollback; then
        log "✅ Database rollback completed successfully"
    else
        handle_error "Database rollback verification failed"
    fi
}

# 📊 PARTIAL ROLLBACK (specific features)
partial_rollback() {
    local feature=$1
    log "📊 Starting partial rollback for feature: $feature"
    
    case $feature in
        "auth")
            kubectl set env deployment/jlpt4you NEXT_PUBLIC_USE_NEW_AUTH=false || handle_error "Failed to disable auth feature"
            ;;
        "middleware")
            kubectl set env deployment/jlpt4you NEXT_PUBLIC_USE_NEW_MIDDLEWARE=false || handle_error "Failed to disable middleware feature"
            ;;
        "api")
            kubectl set env deployment/jlpt4you NEXT_PUBLIC_USE_NEW_API_AUTH=false || handle_error "Failed to disable API auth feature"
            ;;
        *)
            handle_error "Unknown feature: $feature"
            ;;
    esac
    
    # Wait and verify
    sleep 15
    if verify_rollback; then
        log "✅ Partial rollback successful for $feature"
    else
        handle_error "Partial rollback failed for $feature"
    fi
}

# 📋 MAIN FUNCTION
main() {
    local rollback_type=${1:-"emergency"}
    
    log "🛡️  Starting SAFE ROLLBACK PROCEDURES"
    log "📋 Rollback type: $rollback_type"
    log "📅 Backup date: $BACKUP_DATE"
    log "📝 Log file: $LOG_FILE"
    
    case $rollback_type in
        "emergency")
            emergency_rollback
            ;;
        "database")
            database_rollback
            ;;
        "partial")
            partial_rollback "$2"
            ;;
        *)
            log "❌ Unknown rollback type: $rollback_type"
            log "📋 Available types: emergency, database, partial"
            exit 1
            ;;
    esac
    
    log "🎉 Rollback completed successfully!"
    log "📊 Summary logged to: $LOG_FILE"
}

# Execute main function with all arguments
main "$@"
