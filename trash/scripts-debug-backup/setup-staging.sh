#!/bin/bash

# 🏗️ STAGING ENVIRONMENT SETUP SCRIPT
# Creates and configures staging environment for authentication migration testing
# Version: 1.0

set -e

# Configuration
STAGING_DIR="staging"
STAGING_PORT="3001"
LOG_FILE="logs/staging-setup-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "❌ ERROR: $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        handle_error "Node.js is required but not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        handle_error "npm is required but not installed"
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        handle_error "git is required but not installed"
    fi
    
    log "✅ Prerequisites check passed"
}

# Create staging directory structure
create_staging_structure() {
    log "📁 Creating staging directory structure..."
    
    # Remove existing staging if it exists
    if [ -d "$STAGING_DIR" ]; then
        log "⚠️  Removing existing staging directory..."
        rm -rf "$STAGING_DIR"
    fi
    
    # Create staging directory
    mkdir -p "$STAGING_DIR"
    
    # Copy project files to staging
    log "📋 Copying project files to staging..."
    
    # Copy source code
    cp -r src "$STAGING_DIR/"
    cp -r public "$STAGING_DIR/" 2>/dev/null || log "⚠️  No public directory found"
    
    # Copy configuration files
    cp package.json "$STAGING_DIR/" 2>/dev/null || handle_error "package.json not found"
    cp package-lock.json "$STAGING_DIR/" 2>/dev/null || log "⚠️  package-lock.json not found"
    cp next.config.js "$STAGING_DIR/" 2>/dev/null || log "⚠️  next.config.js not found"
    cp tsconfig.json "$STAGING_DIR/" 2>/dev/null || log "⚠️  tsconfig.json not found"
    cp tailwind.config.ts "$STAGING_DIR/" 2>/dev/null || log "⚠️  tailwind.config.ts not found"
    cp postcss.config.js "$STAGING_DIR/" 2>/dev/null || log "⚠️  postcss.config.js not found"
    
    # Copy other important files
    cp .gitignore "$STAGING_DIR/" 2>/dev/null || log "⚠️  .gitignore not found"
    cp README.md "$STAGING_DIR/" 2>/dev/null || log "⚠️  README.md not found"
    
    log "✅ Staging directory structure created"
}

# Create staging environment configuration
create_staging_config() {
    log "⚙️  Creating staging environment configuration..."
    
    # Create staging environment file
    cat > "$STAGING_DIR/.env.local" << EOF
# 🏗️ STAGING ENVIRONMENT CONFIGURATION
# Generated: $(date)

# Environment
NODE_ENV=staging
NEXT_PUBLIC_ENV=staging

# Application
NEXT_PUBLIC_APP_URL=http://localhost:$STAGING_PORT

# Supabase (Mock/Test Configuration)
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key-placeholder
SUPABASE_SERVICE_ROLE_KEY=staging-service-role-key-placeholder

# Feature Flags (Current State - Before Migration)
NEXT_PUBLIC_USE_NEW_AUTH=false
NEXT_PUBLIC_USE_NEW_MIDDLEWARE=false
NEXT_PUBLIC_USE_NEW_API_AUTH=false
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0

# Migration Testing Flags
NEXT_PUBLIC_STAGING_MODE=true
NEXT_PUBLIC_ENABLE_MONITORING=true
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true

# Database (Mock for staging)
DATABASE_URL=postgresql://staging:staging@localhost:5433/jlpt4you_staging

# Security
NEXTAUTH_SECRET=staging-secret-key-for-testing-only
NEXTAUTH_URL=http://localhost:$STAGING_PORT

# Monitoring
NEXT_PUBLIC_MONITORING_ENABLED=true
NEXT_PUBLIC_LOG_LEVEL=debug

# Testing
NEXT_PUBLIC_TESTING_MODE=true
NEXT_PUBLIC_MOCK_AUTH=true
NEXT_PUBLIC_MOCK_PAYMENTS=true
EOF

    # Create staging package.json with different port
    if [ -f "$STAGING_DIR/package.json" ]; then
        # Update package.json for staging
        sed -i.bak 's/"dev": "next dev"/"dev": "next dev -p '$STAGING_PORT'"/' "$STAGING_DIR/package.json" 2>/dev/null || \
        sed -i '' 's/"dev": "next dev"/"dev": "next dev -p '$STAGING_PORT'"/' "$STAGING_DIR/package.json" 2>/dev/null || \
        log "⚠️  Could not update dev port in package.json"
        
        # Add staging script
        if command -v jq &> /dev/null; then
            jq '.scripts.staging = "NODE_ENV=staging next dev -p '$STAGING_PORT'"' "$STAGING_DIR/package.json" > "$STAGING_DIR/package.json.tmp" && \
            mv "$STAGING_DIR/package.json.tmp" "$STAGING_DIR/package.json"
        fi
    fi
    
    log "✅ Staging configuration created"
}

# Install dependencies in staging
install_staging_dependencies() {
    log "📦 Installing dependencies in staging environment..."
    
    cd "$STAGING_DIR"
    
    # Install dependencies
    if npm install; then
        log "✅ Dependencies installed successfully"
    else
        handle_error "Failed to install dependencies"
    fi
    
    cd ..
}

# Create staging test data
create_staging_test_data() {
    log "📊 Creating staging test data..."
    
    # Create mock data directory
    mkdir -p "$STAGING_DIR/mock-data"
    
    # Create mock users data
    cat > "$STAGING_DIR/mock-data/users.json" << EOF
{
  "users": [
    {
      "id": "staging-admin-001",
      "email": "admin@staging.jlpt4you.com",
      "name": "Staging Admin",
      "role": "Admin",
      "balance": 10000,
      "subscription_expires_at": "2025-12-31T23:59:59Z",
      "created_at": "$(date -Iseconds)"
    },
    {
      "id": "staging-user-001",
      "email": "user1@staging.jlpt4you.com",
      "name": "Test User 1",
      "role": "Premium",
      "balance": 500,
      "subscription_expires_at": "2025-12-31T23:59:59Z",
      "created_at": "$(date -Iseconds)"
    },
    {
      "id": "staging-user-002",
      "email": "user2@staging.jlpt4you.com",
      "name": "Test User 2",
      "role": "Free",
      "balance": 0,
      "subscription_expires_at": null,
      "created_at": "$(date -Iseconds)"
    }
  ]
}
EOF

    # Create mock API keys data
    cat > "$STAGING_DIR/mock-data/api-keys.json" << EOF
{
  "api_keys": [
    {
      "user_id": "staging-admin-001",
      "provider": "openai",
      "encrypted_key": "staging-encrypted-key-1",
      "created_at": "$(date -Iseconds)"
    },
    {
      "user_id": "staging-user-001",
      "provider": "anthropic",
      "encrypted_key": "staging-encrypted-key-2",
      "created_at": "$(date -Iseconds)"
    }
  ]
}
EOF

    # Create staging test scenarios
    cat > "$STAGING_DIR/test-scenarios.md" << EOF
# 🧪 STAGING TEST SCENARIOS

## Authentication Test Scenarios

### 1. Current Auth System (Before Migration)
- [ ] Login with staging admin account
- [ ] Login with staging user account
- [ ] Access admin dashboard
- [ ] Access user dashboard
- [ ] Test payment functionality
- [ ] Test PDF access
- [ ] Test AI features

### 2. Migration Testing
- [ ] Enable new auth feature flags gradually
- [ ] Test parallel auth systems
- [ ] Verify backward compatibility
- [ ] Test rollback procedures

### 3. Security Testing
- [ ] Test authentication bypass attempts
- [ ] Test admin access controls
- [ ] Test payment API security
- [ ] Test monitoring and alerting

### 4. Performance Testing
- [ ] Measure auth response times
- [ ] Test concurrent user sessions
- [ ] Monitor system resources

## Test Credentials

### Admin Account
- Email: admin@staging.jlpt4you.com
- Password: staging-admin-password

### User Accounts
- Email: user1@staging.jlpt4you.com
- Password: staging-user-password-1

- Email: user2@staging.jlpt4you.com
- Password: staging-user-password-2

## Expected Results

All tests should pass with current authentication system before proceeding with migration.
EOF

    log "✅ Staging test data created"
}

# Create staging startup script
create_staging_startup() {
    log "🚀 Creating staging startup script..."
    
    cat > "$STAGING_DIR/start-staging.sh" << 'EOF'
#!/bin/bash

# 🏗️ STAGING ENVIRONMENT STARTUP SCRIPT

echo "🏗️ Starting JLPT4YOU Staging Environment..."
echo "📅 $(date)"
echo ""

# Check if we're in the staging directory
if [ ! -f ".env.local" ]; then
    echo "❌ Error: Not in staging directory or .env.local not found"
    exit 1
fi

# Display configuration
echo "⚙️  Staging Configuration:"
echo "   Environment: staging"
echo "   Port: 3001"
echo "   URL: http://localhost:3001"
echo "   Auth Mode: Current (before migration)"
echo ""

# Start the application
echo "🚀 Starting Next.js application..."
npm run dev

EOF

    chmod +x "$STAGING_DIR/start-staging.sh"
    
    # Create staging stop script
    cat > "$STAGING_DIR/stop-staging.sh" << 'EOF'
#!/bin/bash

# 🛑 STAGING ENVIRONMENT STOP SCRIPT

echo "🛑 Stopping JLPT4YOU Staging Environment..."

# Find and kill processes on port 3001
if lsof -ti:3001 >/dev/null 2>&1; then
    echo "🔍 Found processes on port 3001, stopping..."
    lsof -ti:3001 | xargs kill -9
    echo "✅ Staging environment stopped"
else
    echo "ℹ️  No processes found on port 3001"
fi

EOF

    chmod +x "$STAGING_DIR/stop-staging.sh"
    
    log "✅ Staging startup scripts created"
}

# Create staging documentation
create_staging_docs() {
    log "📚 Creating staging documentation..."
    
    cat > "$STAGING_DIR/STAGING-README.md" << EOF
# 🏗️ JLPT4YOU STAGING ENVIRONMENT

**Created:** $(date)  
**Purpose:** Authentication Migration Testing  
**Port:** $STAGING_PORT  
**URL:** http://localhost:$STAGING_PORT  

## 🎯 Purpose

This staging environment is created to test the authentication migration safely before applying changes to production.

## 🚀 Quick Start

\`\`\`bash
# Start staging environment
./start-staging.sh

# Stop staging environment
./stop-staging.sh
\`\`\`

## 📋 Test Checklist

### Pre-Migration Testing (Current Auth)
- [ ] Application starts successfully
- [ ] Login functionality works
- [ ] Admin access works
- [ ] Payment API works (with new security fixes)
- [ ] PDF access works
- [ ] AI features work
- [ ] Monitoring system works

### Migration Testing
- [ ] Feature flags can be toggled
- [ ] New auth system works in parallel
- [ ] Rollback procedures work
- [ ] No data loss during migration

## 🔧 Configuration

### Environment Variables
- \`NODE_ENV=staging\`
- \`NEXT_PUBLIC_STAGING_MODE=true\`
- \`NEXT_PUBLIC_USE_NEW_AUTH=false\` (initially)

### Feature Flags
- New auth: Disabled initially
- New middleware: Disabled initially
- New API auth: Disabled initially
- Rollout percentage: 0%

## 🧪 Testing Procedures

1. **Start staging environment**
2. **Test current functionality**
3. **Gradually enable new features**
4. **Test migration scenarios**
5. **Test rollback procedures**

## 📊 Monitoring

Staging environment includes enhanced monitoring:
- Authentication events
- Security violations
- System performance
- Migration progress

## 🚨 Emergency Procedures

If staging environment has issues:

\`\`\`bash
# Stop staging
./stop-staging.sh

# Reset to clean state
cd ..
rm -rf staging
./scripts/setup-staging.sh
\`\`\`

## 📝 Notes

- This is a testing environment with mock data
- Do not use production credentials
- All changes are isolated from production
- Safe to experiment and break things

EOF

    log "✅ Staging documentation created"
}

# Verify staging setup
verify_staging_setup() {
    log "🔍 Verifying staging setup..."
    
    local errors=0
    
    # Check staging directory
    if [ ! -d "$STAGING_DIR" ]; then
        log "❌ Staging directory not found"
        ((errors++))
    fi
    
    # Check configuration files
    local required_files=(
        "$STAGING_DIR/.env.local"
        "$STAGING_DIR/package.json"
        "$STAGING_DIR/start-staging.sh"
        "$STAGING_DIR/STAGING-README.md"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log "✅ $(basename "$file") - OK"
        else
            log "❌ $(basename "$file") - MISSING"
            ((errors++))
        fi
    done
    
    # Check source files
    if [ -d "$STAGING_DIR/src" ]; then
        log "✅ Source code copied"
    else
        log "❌ Source code missing"
        ((errors++))
    fi
    
    # Check dependencies
    if [ -d "$STAGING_DIR/node_modules" ]; then
        log "✅ Dependencies installed"
    else
        log "❌ Dependencies not installed"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log "✅ Staging setup verification passed"
        return 0
    else
        log "❌ Staging setup verification failed with $errors errors"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🏗️ Setting up staging environment for JLPT4YOU${NC}"
    echo -e "${BLUE}📅 Setup timestamp: $(date)${NC}"
    
    # Create logs directory
    mkdir -p logs
    
    # Execute setup steps
    check_prerequisites
    create_staging_structure
    create_staging_config
    install_staging_dependencies
    create_staging_test_data
    create_staging_startup
    create_staging_docs
    
    # Verify setup
    if verify_staging_setup; then
        echo -e "${GREEN}🎉 Staging environment setup completed successfully!${NC}"
        echo -e "${YELLOW}📁 Staging location: $STAGING_DIR/${NC}"
        echo -e "${YELLOW}🚀 Start staging: cd $STAGING_DIR && ./start-staging.sh${NC}"
        echo -e "${YELLOW}📚 Documentation: $STAGING_DIR/STAGING-README.md${NC}"
    else
        handle_error "Staging setup verification failed"
    fi
}

# Execute main function
main "$@"
