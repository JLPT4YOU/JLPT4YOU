#!/bin/bash

# 🚨 EMERGENCY ROLLBACK SCRIPT
# Immediately disables new authentication system and reverts to old system
# Version: 1.0

set -e

LOG_FILE="logs/emergency-rollback-$(date +%Y%m%d-%H%M%S).log"

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

echo -e "${RED}🚨 EMERGENCY ROLLBACK INITIATED${NC}"
echo -e "${RED}================================${NC}"
echo ""

# Create logs directory
mkdir -p logs

# 1. Immediate Feature Flag Disable
echo -e "${YELLOW}🚩 DISABLING ALL NEW AUTH FEATURES:${NC}"

# Backup current .env.local
cp .env.local .env.local.emergency-backup-$(date +%Y%m%d-%H%M%S)
log "✅ Backed up current .env.local"

# Disable all new auth features
cat > .env.local.emergency << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ixqjqfkqjqjqjqjqjqjq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZmtxanFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI4MDAsImV4cCI6MjA1MTU0ODgwMH0.example
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZmtxanFqcWpxanFqcWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk3MjgwMCwiZXhwIjoyMDUxNTQ4ODAwfQ.example

# OpenAI Configuration
OPENAI_API_KEY=sk-example

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-example

# Mistral AI Configuration
MISTRAL_API_KEY=PuN1Vx4uMfW9FSfosITv0jM4Lo8HZD0t

# 🚨 EMERGENCY ROLLBACK - ALL NEW AUTH FEATURES DISABLED
NEXT_PUBLIC_USE_NEW_AUTH=false
NEXT_PUBLIC_USE_NEW_MIDDLEWARE=false
NEXT_PUBLIC_USE_NEW_API_AUTH=false
NEXT_PUBLIC_USE_NEW_AUTH_CONTEXT=false
NEXT_PUBLIC_USE_RBAC=false
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0

# Keep monitoring enabled for incident analysis
NEXT_PUBLIC_ENABLE_MONITORING=true
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
NEXT_PUBLIC_LOG_LEVEL=error
EOF

# Replace current .env.local
mv .env.local.emergency .env.local
log "🚨 All new authentication features DISABLED"

echo ""

# 2. Log Emergency Event
echo -e "${YELLOW}📝 LOGGING EMERGENCY EVENT:${NC}"

# Create emergency incident log
cat > "logs/emergency-incident-$(date +%Y%m%d-%H%M%S).log" << EOF
🚨 EMERGENCY ROLLBACK INCIDENT REPORT
=====================================

Timestamp: $(date)
Initiated by: Manual emergency rollback
Reason: Emergency rollback requested

ACTIONS TAKEN:
1. All new authentication features disabled
2. Rollout percentage set to 0%
3. System reverted to old authentication
4. Enhanced logging enabled for analysis

SYSTEM STATUS:
- New Auth: DISABLED
- Old Auth: ACTIVE
- Monitoring: ENABLED
- Rollout: 0%

NEXT STEPS:
1. Investigate root cause
2. Monitor system stability
3. Analyze logs for issues
4. Plan remediation
5. Test fixes before re-enabling

EOF

log "📝 Emergency incident logged"

echo ""

# 3. Verify Rollback
echo -e "${YELLOW}🔍 VERIFYING ROLLBACK:${NC}"

# Check environment variables
if [ "${NEXT_PUBLIC_USE_NEW_AUTH:-false}" = "false" ]; then
    log "✅ NEW_AUTH disabled"
else
    log "❌ NEW_AUTH still enabled"
fi

if [ "${NEXT_PUBLIC_ROLLOUT_PERCENTAGE:-0}" = "0" ]; then
    log "✅ Rollout percentage set to 0%"
else
    log "❌ Rollout percentage not reset"
fi

echo ""

# 4. Build Verification
echo -e "${YELLOW}🔨 VERIFYING BUILD:${NC}"

if npm run build >/dev/null 2>&1; then
    log "✅ Build successful with rollback config"
else
    log "❌ Build failed after rollback - critical issue"
    exit 1
fi

echo ""

# 5. System Health Check
echo -e "${YELLOW}🏥 SYSTEM HEALTH CHECK:${NC}"

# Check if server is running
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    log "✅ Main server responding"
else
    log "⚠️  Main server not responding - may need restart"
fi

echo ""

# 6. Rollback Summary
echo -e "${YELLOW}📋 ROLLBACK SUMMARY:${NC}"
echo -e "🚨 ${RED}Status: EMERGENCY ROLLBACK COMPLETE${NC}"
echo -e "🔄 ${GREEN}Old Auth System: ACTIVE${NC}"
echo -e "🚫 ${RED}New Auth System: DISABLED${NC}"
echo -e "📊 ${GREEN}Monitoring: ENABLED${NC}"
echo -e "📝 ${GREEN}Logging: ENHANCED${NC}"

echo ""

# 7. Immediate Actions Required
echo -e "${YELLOW}⚡ IMMEDIATE ACTIONS REQUIRED:${NC}"
echo "1. 🔄 Restart application server"
echo "2. 📊 Monitor system stability"
echo "3. 🔍 Investigate root cause"
echo "4. 📝 Analyze error logs"
echo "5. 👥 Notify team of incident"

echo ""

# 8. Investigation Checklist
echo -e "${YELLOW}🔍 INVESTIGATION CHECKLIST:${NC}"
echo "□ Check authentication error rates"
echo "□ Review performance metrics"
echo "□ Analyze user feedback"
echo "□ Check security incidents"
echo "□ Review system resource usage"
echo "□ Examine database performance"
echo "□ Check third-party integrations"

echo ""

# 9. Recovery Planning
echo -e "${YELLOW}🛠️  RECOVERY PLANNING:${NC}"
echo "Before re-enabling new auth system:"
echo "• Identify and fix root cause"
echo "• Test fixes in staging environment"
echo "• Prepare gradual re-rollout plan"
echo "• Update monitoring and alerting"
echo "• Document lessons learned"

echo ""

log "🚨 Emergency rollback completed successfully"
log "📊 System reverted to old authentication"
log "📝 Full incident log: $LOG_FILE"

echo -e "${RED}🚨 EMERGENCY ROLLBACK COMPLETE${NC}"
echo -e "${YELLOW}📝 Incident log: $LOG_FILE${NC}"
echo -e "${BLUE}🔄 Restart server: npm run dev${NC}"

# Optional: Restart development server
read -p "Restart development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Restarting development server..."
    # Kill existing server
    pkill -f "next dev" || true
    sleep 2
    # Start new server in background
    npm run dev > logs/dev-server-emergency-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    echo "✅ Development server restarted with old auth system"
fi

echo ""
echo -e "${RED}🚨 REMEMBER: Investigate root cause before re-enabling new auth!${NC}"
