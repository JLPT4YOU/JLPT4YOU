#!/bin/bash

# 📊 MONITOR 15% ROLLOUT SCRIPT
# Enhanced monitoring for 15% rollout phase
# Version: 1.0

LOG_FILE="logs/monitor-15-rollout-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Monitoring counters
TOTAL_CHECKS=0
SUCCESS_COUNT=0
ERROR_COUNT=0
TOTAL_RESPONSE_TIME=0

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

echo -e "${BLUE}📊 MONITORING 15% ROLLOUT${NC}"
echo -e "${BLUE}=========================${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Function to test system health
test_system_health() {
    local iteration=$1
    
    echo -e "${YELLOW}--- Check #$iteration ---${NC}"
    
    # Test auth endpoint
    local auth_start=$(date +%s%3N)
    local auth_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/auth/vn/login 2>/dev/null)
    local auth_end=$(date +%s%3N)
    local auth_time=$((auth_end - auth_start))
    
    # Test home endpoint
    local home_start=$(date +%s%3N)
    local home_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/home 2>/dev/null)
    local home_end=$(date +%s%3N)
    local home_time=$((home_end - home_start))
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local avg_time=$(((auth_time + home_time) / 2))
    TOTAL_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME + avg_time))
    
    # Check results
    if [ "$auth_response" = "200" ] && ([ "$home_response" = "200" ] || [ "$home_response" = "307" ]); then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -e "✅ ${GREEN}HEALTHY${NC} - Auth: ${auth_response} (${auth_time}ms), Home: ${home_response} (${home_time}ms)"
        log "HEALTH_CHECK: SUCCESS - Auth: ${auth_response}/${auth_time}ms, Home: ${home_response}/${home_time}ms"
    else
        ERROR_COUNT=$((ERROR_COUNT + 1))
        echo -e "❌ ${RED}ISSUE${NC} - Auth: ${auth_response} (${auth_time}ms), Home: ${home_response} (${home_time}ms)"
        log "HEALTH_CHECK: ERROR - Auth: ${auth_response}/${auth_time}ms, Home: ${home_response}/${home_time}ms"
    fi
    
    # Check performance thresholds
    if [ $avg_time -gt 100 ]; then
        echo -e "⚠️  ${YELLOW}SLOW RESPONSE${NC}: ${avg_time}ms (target: <100ms)"
        log "PERFORMANCE_WARNING: Average response time ${avg_time}ms > 100ms threshold"
    fi
}

# Function to display metrics
display_metrics() {
    local avg_response_time=0
    if [ $TOTAL_CHECKS -gt 0 ]; then
        avg_response_time=$((TOTAL_RESPONSE_TIME / TOTAL_CHECKS))
    fi
    
    local success_rate=0
    if [ $TOTAL_CHECKS -gt 0 ]; then
        success_rate=$((SUCCESS_COUNT * 100 / TOTAL_CHECKS))
    fi
    
    local error_rate=$((ERROR_COUNT * 100 / TOTAL_CHECKS))
    
    echo ""
    echo -e "${YELLOW}📊 15% ROLLOUT METRICS:${NC}"
    echo -e "┌─────────────────────────────────────────────────────────────┐"
    echo -e "│ Total Checks: $TOTAL_CHECKS                                        │"
    echo -e "│ Success Rate: ${GREEN}${success_rate}%${NC} (target: >99%)                      │"
    echo -e "│ Error Rate: ${RED}${error_rate}%${NC} (target: <1%)                         │"
    echo -e "│ Avg Response: ${avg_response_time}ms (target: <100ms)              │"
    echo -e "│ Rollout: ${GREEN}15%${NC} active                                     │"
    echo -e "└─────────────────────────────────────────────────────────────┘"
    
    # Success criteria check
    if [ $success_rate -ge 99 ] && [ $avg_response_time -le 100 ] && [ $error_rate -le 1 ]; then
        echo -e "${GREEN}✅ ALL SUCCESS CRITERIA MET${NC}"
        echo -e "${GREEN}🚀 Ready for next rollout phase (25%)${NC}"
    else
        echo -e "${YELLOW}⚠️  MONITORING CRITERIA:${NC}"
        echo -e "  Success Rate: ${success_rate}% (target: ≥99%)"
        echo -e "  Error Rate: ${error_rate}% (target: ≤1%)"
        echo -e "  Avg Response: ${avg_response_time}ms (target: ≤100ms)"
    fi
    
    log "METRICS_SUMMARY: checks=$TOTAL_CHECKS, success_rate=${success_rate}%, error_rate=${error_rate}%, avg_time=${avg_response_time}ms"
}

# Function to check for critical issues
check_critical_issues() {
    if [ $TOTAL_CHECKS -ge 5 ]; then
        local error_rate=$((ERROR_COUNT * 100 / TOTAL_CHECKS))
        local avg_response_time=$((TOTAL_RESPONSE_TIME / TOTAL_CHECKS))
        
        if [ $error_rate -gt 2 ]; then
            echo -e "${RED}🚨 CRITICAL: Error rate too high (${error_rate}%)${NC}"
            echo -e "${RED}🚨 RECOMMEND: Execute emergency rollback${NC}"
            log "CRITICAL_ALERT: High error rate detected: ${error_rate}%"
            return 1
        fi
        
        if [ $avg_response_time -gt 200 ]; then
            echo -e "${RED}🚨 CRITICAL: Response time too slow (${avg_response_time}ms)${NC}"
            echo -e "${RED}🚨 RECOMMEND: Execute emergency rollback${NC}"
            log "CRITICAL_ALERT: Slow response time detected: ${avg_response_time}ms"
            return 1
        fi
    fi
    
    return 0
}

# Initial status
echo -e "${YELLOW}🚀 15% ROLLOUT MONITORING STARTED${NC}"
echo -e "${YELLOW}Target: 15% of users using new authentication${NC}"
echo -e "${YELLOW}Success Criteria: >99% success, <100ms response, <1% errors${NC}"
echo ""

log "15% ROLLOUT MONITORING STARTED"
log "Target metrics: >99% success rate, <100ms response time, <1% error rate"

# Main monitoring loop
ITERATION=0
while [ $ITERATION -lt 20 ]; do  # Run 20 checks (about 2 minutes)
    ITERATION=$((ITERATION + 1))
    
    test_system_health $ITERATION
    
    # Display metrics every 5 iterations
    if [ $((ITERATION % 5)) -eq 0 ]; then
        display_metrics
        
        # Check for critical issues
        if ! check_critical_issues; then
            echo ""
            echo -e "${RED}🚨 CRITICAL ISSUES DETECTED - STOPPING MONITORING${NC}"
            echo -e "${RED}Execute: ./scripts/emergency-rollback.sh${NC}"
            break
        fi
        echo ""
    fi
    
    # Wait before next check
    sleep 6
done

# Final summary
echo ""
echo -e "${YELLOW}📊 FINAL 15% ROLLOUT SUMMARY:${NC}"
display_metrics

# Overall assessment
if [ $TOTAL_CHECKS -gt 0 ]; then
    local final_success_rate=$((SUCCESS_COUNT * 100 / TOTAL_CHECKS))
    local final_avg_time=$((TOTAL_RESPONSE_TIME / TOTAL_CHECKS))
    local final_error_rate=$((ERROR_COUNT * 100 / TOTAL_CHECKS))
    
    if [ $final_success_rate -ge 99 ] && [ $final_avg_time -le 100 ] && [ $final_error_rate -le 1 ]; then
        echo ""
        echo -e "${GREEN}🎉 15% ROLLOUT: SUCCESSFUL${NC}"
        echo -e "${GREEN}✅ All success criteria met${NC}"
        echo -e "${GREEN}🚀 Ready to proceed to 25% rollout${NC}"
        log "15% ROLLOUT: SUCCESSFUL - All criteria met"
    else
        echo ""
        echo -e "${YELLOW}⚠️  15% ROLLOUT: NEEDS ATTENTION${NC}"
        echo -e "${YELLOW}🔍 Review metrics before proceeding${NC}"
        log "15% ROLLOUT: NEEDS_ATTENTION - Some criteria not met"
    fi
fi

echo ""
echo -e "${BLUE}📝 Full monitoring log: $LOG_FILE${NC}"
echo -e "${BLUE}🔄 Run dashboard: ./scripts/rollout-dashboard.sh${NC}"
echo -e "${BLUE}🚨 Emergency rollback: ./scripts/emergency-rollback.sh${NC}"

log "15% ROLLOUT MONITORING COMPLETED"
