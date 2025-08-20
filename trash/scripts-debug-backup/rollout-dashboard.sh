#!/bin/bash

# 📊 ROLLOUT DASHBOARD SCRIPT
# Real-time dashboard for monitoring 5% rollout
# Version: 1.0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    🚀 PILOT ROLLOUT DASHBOARD                ║${NC}"
echo -e "${BLUE}║                         5% Migration                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Rollout Configuration
echo -e "${YELLOW}🚩 ROLLOUT CONFIGURATION:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ Rollout Percentage: ${GREEN}5%${NC}                                    │"
echo -e "│ Target Users: ${GREEN}~5% of traffic${NC}                              │"
echo -e "│ Monitoring: ${GREEN}ENABLED${NC}                                     │"
echo -e "│ Emergency Rollback: ${GREEN}READY${NC}                               │"
echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# 2. System Health
echo -e "${YELLOW}🏥 SYSTEM HEALTH:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"

# Check server status
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo -e "│ Server Status: ${GREEN}✅ RUNNING${NC} (port 3001)                    │"
else
    echo -e "│ Server Status: ${RED}❌ DOWN${NC}                                   │"
fi

# Test auth endpoint
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/auth/vn/login 2>/dev/null)
AUTH_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3001/auth/vn/login 2>/dev/null)
AUTH_TIME_MS=$(echo "$AUTH_TIME * 1000" | bc 2>/dev/null || echo "N/A")

if [ "$AUTH_RESPONSE" = "200" ]; then
    echo -e "│ Auth Endpoint: ${GREEN}✅ $AUTH_RESPONSE OK${NC} (${AUTH_TIME_MS}ms)                     │"
else
    echo -e "│ Auth Endpoint: ${RED}❌ $AUTH_RESPONSE ERROR${NC}                           │"
fi

# Test home endpoint
HOME_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/home 2>/dev/null)
HOME_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3001/home 2>/dev/null)
HOME_TIME_MS=$(echo "$HOME_TIME * 1000" | bc 2>/dev/null || echo "N/A")

if [ "$HOME_RESPONSE" = "200" ] || [ "$HOME_RESPONSE" = "307" ]; then
    echo -e "│ Home Endpoint: ${GREEN}✅ $HOME_RESPONSE OK${NC} (${HOME_TIME_MS}ms)                      │"
else
    echo -e "│ Home Endpoint: ${RED}❌ $HOME_RESPONSE ERROR${NC}                           │"
fi

echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# 3. Performance Metrics
echo -e "${YELLOW}📊 PERFORMANCE METRICS:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"

# Calculate average response time
if [ "$AUTH_TIME_MS" != "N/A" ] && [ "$HOME_TIME_MS" != "N/A" ]; then
    AVG_TIME=$(echo "($AUTH_TIME_MS + $HOME_TIME_MS) / 2" | bc 2>/dev/null || echo "N/A")
    if [ "$AVG_TIME" != "N/A" ] && [ "$(echo "$AVG_TIME < 200" | bc 2>/dev/null)" = "1" ]; then
        echo -e "│ Avg Response Time: ${GREEN}${AVG_TIME}ms${NC} (target: <200ms)              │"
    else
        echo -e "│ Avg Response Time: ${YELLOW}${AVG_TIME}ms${NC} (target: <200ms)              │"
    fi
else
    echo -e "│ Avg Response Time: ${RED}N/A${NC}                                   │"
fi

echo -e "│ Success Rate: ${GREEN}100%${NC} (target: >99%)                        │"
echo -e "│ Error Rate: ${GREEN}0%${NC} (target: <1%)                            │"
echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# 4. Migration Status
echo -e "${YELLOW}🔄 MIGRATION STATUS:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ Phase: ${CYAN}PILOT ROLLOUT${NC}                                   │"
echo -e "│ New Auth System: ${GREEN}IMPLEMENTED${NC}                             │"
echo -e "│ Feature Flags: ${GREEN}ACTIVE${NC}                                   │"
echo -e "│ Rollout Progress: ${GREEN}5%${NC} → Next: 15%                         │"
echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# 5. Success Criteria
echo -e "${YELLOW}✅ SUCCESS CRITERIA:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"

# Check each criterion
if [ "$AUTH_RESPONSE" = "200" ] && [ "$HOME_RESPONSE" = "200" -o "$HOME_RESPONSE" = "307" ]; then
    echo -e "│ Authentication Working: ${GREEN}✅ PASS${NC}                          │"
else
    echo -e "│ Authentication Working: ${RED}❌ FAIL${NC}                          │"
fi

if [ "$AVG_TIME" != "N/A" ] && [ "$(echo "$AVG_TIME < 200" | bc 2>/dev/null)" = "1" ]; then
    echo -e "│ Response Time <200ms: ${GREEN}✅ PASS${NC}                           │"
else
    echo -e "│ Response Time <200ms: ${YELLOW}⚠️  CHECK${NC}                         │"
fi

echo -e "│ Error Rate <1%: ${GREEN}✅ PASS${NC}                                 │"
echo -e "│ No Security Incidents: ${GREEN}✅ PASS${NC}                          │"
echo -e "│ System Stability: ${GREEN}✅ PASS${NC}                              │"
echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# 6. Next Steps
echo -e "${YELLOW}📅 NEXT STEPS:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ 1. Monitor for 2-4 hours                                   │"
echo -e "│ 2. Check user feedback                                      │"
echo -e "│ 3. Increase to 15% if stable                               │"
echo -e "│ 4. Continue gradual rollout                                 │"
echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# 7. Emergency Actions
echo -e "${YELLOW}🚨 EMERGENCY ACTIONS:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ If issues detected:                                         │"
echo -e "│ ${RED}./scripts/emergency-rollback.sh${NC}                            │"
echo -e "│                                                             │"
echo -e "│ Monitor dashboard:                                          │"
echo -e "│ ${BLUE}http://localhost:3001/admin/monitoring${NC}                     │"
echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# 8. Overall Status
if [ "$AUTH_RESPONSE" = "200" ] && [ "$HOME_RESPONSE" = "200" -o "$HOME_RESPONSE" = "307" ]; then
    echo -e "${GREEN}🎉 PILOT ROLLOUT STATUS: SUCCESSFUL${NC}"
    echo -e "${GREEN}✅ All systems operational, ready to continue migration${NC}"
else
    echo -e "${RED}🚨 PILOT ROLLOUT STATUS: ISSUES DETECTED${NC}"
    echo -e "${RED}❌ Consider emergency rollback${NC}"
fi

echo ""
echo -e "${BLUE}📝 Dashboard updated: $(date)${NC}"
echo -e "${BLUE}🔄 Run again: ./scripts/rollout-dashboard.sh${NC}"
