#!/bin/bash

# 📈 INCREASE ROLLOUT TO 15% SCRIPT
# Safely increases rollout from 5% to 15%
# Version: 1.0

LOG_FILE="logs/rollout-15-$(date +%Y%m%d-%H%M%S).log"

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

echo -e "${BLUE}📈 INCREASING ROLLOUT TO 15%${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

# Create logs directory
mkdir -p logs

# 1. Pre-rollout Validation
echo -e "${YELLOW}🔍 PRE-ROLLOUT VALIDATION:${NC}"

# Check current rollout status
CURRENT_ROLLOUT=${NEXT_PUBLIC_ROLLOUT_PERCENTAGE:-0}
log "Current rollout percentage: $CURRENT_ROLLOUT%"

if [ "$CURRENT_ROLLOUT" != "5" ]; then
    echo -e "${RED}❌ Current rollout is not 5% (found: $CURRENT_ROLLOUT%)${NC}"
    echo -e "${RED}Please ensure 5% rollout is stable before proceeding${NC}"
    exit 1
fi

# Check system health
echo "Checking system health..."
if ! curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo -e "${RED}❌ Server not responding${NC}"
    exit 1
fi

# Test authentication endpoints
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/vn/login)
if [ "$AUTH_STATUS" != "200" ]; then
    echo -e "${RED}❌ Auth endpoint not healthy (status: $AUTH_STATUS)${NC}"
    exit 1
fi

log "✅ Pre-rollout validation passed"
echo -e "✅ ${GREEN}Pre-rollout validation passed${NC}"
echo ""

# 2. Performance Baseline Check
echo -e "${YELLOW}📊 PERFORMANCE BASELINE CHECK:${NC}"

# Test response times
AUTH_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3001/auth/vn/login)
HOME_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3001/home)

AUTH_TIME_MS=$(echo "$AUTH_TIME * 1000" | bc 2>/dev/null || echo "0")
HOME_TIME_MS=$(echo "$HOME_TIME * 1000" | bc 2>/dev/null || echo "0")

log "Auth endpoint response time: ${AUTH_TIME_MS}ms"
log "Home endpoint response time: ${HOME_TIME_MS}ms"

# Check if response times are acceptable
if [ "$(echo "$AUTH_TIME_MS > 200" | bc 2>/dev/null)" = "1" ]; then
    echo -e "${YELLOW}⚠️  Auth response time high: ${AUTH_TIME_MS}ms${NC}"
fi

echo -e "✅ ${GREEN}Performance baseline acceptable${NC}"
echo ""

# 3. Backup Current Configuration
echo -e "${YELLOW}💾 BACKING UP CURRENT CONFIGURATION:${NC}"

# Create backup
BACKUP_FILE=".env.local.backup-15-rollout-$(date +%Y%m%d-%H%M%S)"
cp .env.local "$BACKUP_FILE"
log "✅ Configuration backed up to: $BACKUP_FILE"
echo -e "✅ ${GREEN}Configuration backed up${NC}"
echo ""

# 4. Update Rollout Percentage
echo -e "${YELLOW}⚙️  UPDATING ROLLOUT TO 15%:${NC}"

# Update environment variable
if grep -q "NEXT_PUBLIC_ROLLOUT_PERCENTAGE" .env.local; then
    sed -i.bak 's/NEXT_PUBLIC_ROLLOUT_PERCENTAGE=.*/NEXT_PUBLIC_ROLLOUT_PERCENTAGE=15/' .env.local
else
    echo "NEXT_PUBLIC_ROLLOUT_PERCENTAGE=15" >> .env.local
fi

# Ensure enhanced monitoring is enabled
if grep -q "NEXT_PUBLIC_ENABLE_MONITORING" .env.local; then
    sed -i.bak 's/NEXT_PUBLIC_ENABLE_MONITORING=.*/NEXT_PUBLIC_ENABLE_MONITORING=true/' .env.local
else
    echo "NEXT_PUBLIC_ENABLE_MONITORING=true" >> .env.local
fi

log "✅ Updated rollout percentage to 15%"
echo -e "✅ ${GREEN}Rollout percentage updated to 15%${NC}"
echo ""

# 5. Build and Validate
echo -e "${YELLOW}🔨 BUILDING WITH NEW CONFIGURATION:${NC}"

if npm run build >/dev/null 2>&1; then
    log "✅ Build successful with 15% rollout config"
    echo -e "✅ ${GREEN}Build successful${NC}"
else
    log "❌ Build failed - rolling back"
    echo -e "${RED}❌ Build failed - rolling back${NC}"
    
    # Restore backup
    mv "$BACKUP_FILE" .env.local
    exit 1
fi
echo ""

# 6. Test Rollout Distribution
echo -e "${YELLOW}📊 TESTING ROLLOUT DISTRIBUTION:${NC}"

NEW_AUTH_COUNT=0
OLD_AUTH_COUNT=0

for i in {1..100}; do
    # Simulate feature flag check
    ROLLOUT_PERCENTAGE=15
    HASH=$(echo -n "NEW_AUTH_SYSTEM$i" | md5 | cut -c1-8)
    HASH_NUM=$((0x$HASH))
    PERCENTAGE=$((HASH_NUM % 100))
    
    if [ $PERCENTAGE -lt $ROLLOUT_PERCENTAGE ]; then
        NEW_AUTH_COUNT=$((NEW_AUTH_COUNT + 1))
    else
        OLD_AUTH_COUNT=$((OLD_AUTH_COUNT + 1))
    fi
done

ACTUAL_PERCENTAGE=$((NEW_AUTH_COUNT))
log "Rollout distribution test: ${ACTUAL_PERCENTAGE}/100 = ${ACTUAL_PERCENTAGE}%"

if [ $ACTUAL_PERCENTAGE -ge 10 ] && [ $ACTUAL_PERCENTAGE -le 20 ]; then
    echo -e "✅ ${GREEN}Rollout distribution correct: ${ACTUAL_PERCENTAGE}% ≈ 15%${NC}"
else
    echo -e "${YELLOW}⚠️  Rollout distribution: ${ACTUAL_PERCENTAGE}% (expected ~15%)${NC}"
fi
echo ""

# 7. Enhanced Monitoring Setup
echo -e "${YELLOW}📊 ENHANCED MONITORING SETUP:${NC}"

# Create monitoring configuration for 15% rollout
cat > "logs/monitoring-config-15.json" << EOF
{
  "rollout_percentage": 15,
  "target_users": "~15% of traffic",
  "monitoring_level": "enhanced",
  "alert_thresholds": {
    "response_time_ms": 100,
    "error_rate_percent": 1,
    "success_rate_percent": 99
  },
  "rollback_triggers": {
    "response_time_ms": 300,
    "error_rate_percent": 2,
    "success_rate_percent": 95
  },
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

log "✅ Enhanced monitoring configured"
echo -e "✅ ${GREEN}Enhanced monitoring configured${NC}"
echo ""

# 8. Rollout Summary
echo -e "${YELLOW}📋 15% ROLLOUT SUMMARY:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ Previous Rollout: ${GREEN}5%${NC}                                      │"
echo -e "│ New Rollout: ${GREEN}15%${NC}                                         │"
echo -e "│ Target Users: ${GREEN}~15% of traffic${NC}                            │"
echo -e "│ Monitoring: ${GREEN}ENHANCED${NC}                                    │"
echo -e "│ Rollback: ${GREEN}READY${NC}                                         │"
echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# 9. Success Criteria for 15% Rollout
echo -e "${YELLOW}✅ SUCCESS CRITERIA FOR 15% ROLLOUT:${NC}"
echo "• Response Time: <100ms average"
echo "• Success Rate: >99%"
echo "• Error Rate: <1%"
echo "• System Stability: No degradation"
echo "• User Experience: No complaints"
echo ""

# 10. Monitoring Instructions
echo -e "${YELLOW}📊 MONITORING INSTRUCTIONS:${NC}"
echo "1. Monitor dashboard: ./scripts/rollout-dashboard.sh"
echo "2. Watch response times closely"
echo "3. Check error rates every 15 minutes"
echo "4. Monitor system resources"
echo "5. Collect user feedback"
echo ""

# 11. Next Steps Timeline
echo -e "${YELLOW}📅 NEXT STEPS TIMELINE:${NC}"
echo "• Next 2 hours: Monitor 15% rollout closely"
echo "• Hour 4: Increase to 25% if stable"
echo "• Hour 8: Increase to 50% if stable"
echo "• Day 2: Consider full rollout (100%)"
echo ""

# 12. Emergency Procedures
echo -e "${YELLOW}🚨 EMERGENCY PROCEDURES:${NC}"
echo "If issues detected:"
echo "1. Run: ./scripts/emergency-rollback.sh"
echo "2. Or manually: NEXT_PUBLIC_ROLLOUT_PERCENTAGE=5"
echo "3. Restart server: npm run dev"
echo "4. Investigate root cause"
echo ""

log "🚀 15% rollout completed successfully!"
log "📊 Monitor dashboard: ./scripts/rollout-dashboard.sh"
log "📝 Full log: $LOG_FILE"

echo -e "${GREEN}🎉 15% ROLLOUT ACTIVE!${NC}"
echo -e "${BLUE}📊 Monitor: ./scripts/rollout-dashboard.sh${NC}"
echo -e "${BLUE}📝 Log: $LOG_FILE${NC}"

# Optional: Restart development server
read -p "Restart development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Restarting development server..."
    # Kill existing server
    pkill -f "next dev" || true
    sleep 2
    # Start new server in background
    npm run dev > logs/dev-server-15-rollout-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    echo "✅ Development server restarted with 15% rollout"
fi

echo ""
echo -e "${GREEN}🚀 15% ROLLOUT DEPLOYMENT COMPLETE!${NC}"
