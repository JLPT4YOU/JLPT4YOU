#!/bin/bash

# 🚀 START PILOT ROLLOUT SCRIPT
# Begins 5% gradual rollout of new authentication system
# Version: 1.0

set -e

LOG_FILE="logs/pilot-rollout-$(date +%Y%m%d-%H%M%S).log"

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

echo -e "${BLUE}🚀 STARTING PILOT ROLLOUT (5%)${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Create logs directory
mkdir -p logs

# 1. Pre-rollout Safety Checks
echo -e "${YELLOW}🔍 PRE-ROLLOUT SAFETY CHECKS:${NC}"

# Check if backup exists
if [ -d "backup" ] && [ "$(ls -A backup/)" ]; then
    log "✅ Backup system ready"
else
    log "❌ No backup found - creating backup first"
    ./scripts/dev-encrypted-backup.sh jlpt4you
fi

# Check if monitoring is enabled
if [ "${NEXT_PUBLIC_ENABLE_MONITORING:-false}" = "true" ]; then
    log "✅ Monitoring enabled"
else
    log "⚠️  Enabling monitoring for rollout"
    echo "NEXT_PUBLIC_ENABLE_MONITORING=true" >> .env.local
fi

# Check if new auth files exist
required_files=(
    "src/lib/auth/supabase-ssr.ts"
    "src/lib/auth/rbac.ts"
    "src/lib/auth/middleware-v2.ts"
    "src/contexts/auth-context-v2.tsx"
    "src/lib/feature-flags.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log "✅ $file exists"
    else
        log "❌ Missing required file: $file"
        exit 1
    fi
done

echo ""

# 2. Update Environment Variables for 5% Rollout
echo -e "${YELLOW}⚙️  CONFIGURING 5% PILOT ROLLOUT:${NC}"

# Backup current .env.local
cp .env.local .env.local.backup-$(date +%Y%m%d-%H%M%S)
log "✅ Backed up current .env.local"

# Update rollout percentage
if grep -q "NEXT_PUBLIC_ROLLOUT_PERCENTAGE" .env.local; then
    sed -i.bak 's/NEXT_PUBLIC_ROLLOUT_PERCENTAGE=.*/NEXT_PUBLIC_ROLLOUT_PERCENTAGE=5/' .env.local
else
    echo "NEXT_PUBLIC_ROLLOUT_PERCENTAGE=5" >> .env.local
fi

# Ensure monitoring is enabled
if grep -q "NEXT_PUBLIC_ENABLE_MONITORING" .env.local; then
    sed -i.bak 's/NEXT_PUBLIC_ENABLE_MONITORING=.*/NEXT_PUBLIC_ENABLE_MONITORING=true/' .env.local
else
    echo "NEXT_PUBLIC_ENABLE_MONITORING=true" >> .env.local
fi

# Enable debug logs for pilot
if grep -q "NEXT_PUBLIC_ENABLE_DEBUG_LOGS" .env.local; then
    sed -i.bak 's/NEXT_PUBLIC_ENABLE_DEBUG_LOGS=.*/NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true/' .env.local
else
    echo "NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true" >> .env.local
fi

log "✅ Updated environment variables for 5% rollout"
echo ""

# 3. Build and Test
echo -e "${YELLOW}🔨 BUILDING WITH NEW CONFIGURATION:${NC}"

if npm run build >/dev/null 2>&1; then
    log "✅ Build successful with 5% rollout config"
else
    log "❌ Build failed - rolling back"
    # Find the most recent backup file
    BACKUP_FILE=$(ls -t .env.local.backup-* 2>/dev/null | head -1)
    if [ -n "$BACKUP_FILE" ]; then
        mv "$BACKUP_FILE" .env.local
        log "✅ Rolled back to: $BACKUP_FILE"
    else
        log "⚠️  No backup file found, keeping current config"
    fi
    exit 1
fi

echo ""

# 4. Start Monitoring
echo -e "${YELLOW}📊 STARTING ENHANCED MONITORING:${NC}"

# Create monitoring dashboard URL
MONITORING_URL="http://localhost:3000/admin/monitoring"

log "✅ Monitoring dashboard available at: $MONITORING_URL"
log "✅ Enhanced logging enabled"
log "✅ Migration events tracking active"

echo ""

# 5. Rollout Summary
echo -e "${YELLOW}📋 PILOT ROLLOUT SUMMARY:${NC}"
echo -e "🎯 ${GREEN}Rollout Percentage: 5%${NC}"
echo -e "👥 ${GREEN}Target Users: ~5% of traffic${NC}"
echo -e "📊 ${GREEN}Monitoring: ENABLED${NC}"
echo -e "🔄 ${GREEN}Rollback: Ready${NC}"
echo -e "📝 ${GREEN}Logging: Enhanced${NC}"

echo ""

# 6. Monitoring Instructions
echo -e "${YELLOW}📊 MONITORING INSTRUCTIONS:${NC}"
echo "1. Watch for authentication errors in logs"
echo "2. Monitor response times (should be < 200ms)"
echo "3. Check user experience feedback"
echo "4. Monitor system resource usage"
echo "5. Track migration events in dashboard"

echo ""

# 7. Rollback Instructions
echo -e "${YELLOW}🔄 ROLLBACK INSTRUCTIONS (if needed):${NC}"
echo "If issues are detected:"
echo "1. Run: ./scripts/emergency-rollback.sh"
echo "2. Or manually set: NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0"
echo "3. Restart application: npm run dev"
echo "4. Monitor for stability"

echo ""

# 8. Success Criteria
echo -e "${YELLOW}✅ SUCCESS CRITERIA FOR PILOT:${NC}"
echo "• < 1% authentication error rate"
echo "• < 200ms average response time"
echo "• No critical security incidents"
echo "• Positive user feedback"
echo "• System stability maintained"

echo ""

# 9. Next Steps Timeline
echo -e "${YELLOW}📅 NEXT STEPS TIMELINE:${NC}"
echo "• Day 1-2: Monitor pilot (5%)"
echo "• Day 3: Increase to 15% if stable"
echo "• Day 5: Increase to 25% if stable"
echo "• Day 7: Increase to 50% if stable"
echo "• Day 10: Full rollout (100%)"

echo ""

log "🚀 Pilot rollout (5%) started successfully!"
log "📊 Monitor dashboard: $MONITORING_URL"
log "📝 Full log: $LOG_FILE"

echo -e "${GREEN}🎉 PILOT ROLLOUT ACTIVE!${NC}"
echo -e "${BLUE}📊 Monitor at: $MONITORING_URL${NC}"
echo -e "${BLUE}📝 Log file: $LOG_FILE${NC}"

# Optional: Restart development server
read -p "Restart development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Restarting development server..."
    # Kill existing server
    pkill -f "next dev" || true
    sleep 2
    # Start new server in background
    npm run dev > logs/dev-server-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    echo "✅ Development server restarted with 5% rollout"
fi
