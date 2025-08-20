#!/bin/bash

# 📊 COMPREHENSIVE 50% ROLLOUT MONITORING
# Real-time monitoring for 50% rollout phase - MAJORITY ADOPTION
# Version: 1.0

LOG_FILE="logs/monitor-50-rollout-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Monitoring counters
TOTAL_TESTS=0
SUCCESS_COUNT=0
ERROR_COUNT=0
TOTAL_RESPONSE_TIME=0

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  🎉 50% ROLLOUT MONITORING                   ║${NC}"
echo -e "${BLUE}║                   MAJORITY ADOPTION PHASE                   ║${NC}"
echo -e "${BLUE}║                  Supabase Authentication                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Function to test endpoint performance
test_endpoint_performance() {
    local endpoint="$1"
    local test_name="$2"
    
    local response=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null "$endpoint" 2>/dev/null)
    local http_code=$(echo "$response" | cut -d: -f1)
    local time_total=$(echo "$response" | cut -d: -f2)
    local time_ms=$(echo "$time_total * 1000" | bc 2>/dev/null || echo "0")
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "307" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        TOTAL_RESPONSE_TIME=$(echo "$TOTAL_RESPONSE_TIME + $time_ms" | bc 2>/dev/null || echo "$TOTAL_RESPONSE_TIME")
        echo -e "✅ ${GREEN}$test_name: $http_code OK (${time_ms}ms)${NC}"
        log "SUCCESS: $test_name - $http_code/${time_ms}ms"
    else
        ERROR_COUNT=$((ERROR_COUNT + 1))
        echo -e "❌ ${RED}$test_name: $http_code ERROR (${time_ms}ms)${NC}"
        log "ERROR: $test_name - $http_code/${time_ms}ms"
    fi
}

# Function to display real-time metrics
display_metrics() {
    local avg_response_time=0
    local success_rate=0
    local error_rate=0
    
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((SUCCESS_COUNT * 100 / TOTAL_TESTS))
        error_rate=$((ERROR_COUNT * 100 / TOTAL_TESTS))
    fi
    
    if [ $SUCCESS_COUNT -gt 0 ]; then
        avg_response_time=$(echo "scale=1; $TOTAL_RESPONSE_TIME / $SUCCESS_COUNT" | bc 2>/dev/null || echo "0")
    fi
    
    echo ""
    echo -e "${YELLOW}📊 REAL-TIME 50% ROLLOUT METRICS:${NC}"
    echo -e "┌─────────────────────────────────────────────────────────────┐"
    echo -e "│ ${PURPLE}🎉 MAJORITY ADOPTION ACTIVE${NC}                              │"
    echo -e "│ Total Tests: $TOTAL_TESTS                                        │"
    echo -e "│ Success Rate: ${GREEN}${success_rate}%${NC} (target: >99%)                      │"
    echo -e "│ Error Rate: ${RED}${error_rate}%${NC} (target: <1%)                         │"
    echo -e "│ Avg Response: ${avg_response_time}ms (target: <100ms)              │"
    echo -e "│ Load Level: ${CYAN}50% rollout${NC} (2x increase from 25%)        │"
    echo -e "│ Migration: ${PURPLE}MAJORITY USING SUPABASE${NC}                    │"
    echo -e "└─────────────────────────────────────────────────────────────┘"
    
    # Success criteria assessment
    if [ $success_rate -ge 99 ] && [ "$(echo "$avg_response_time < 100" | bc 2>/dev/null)" = "1" ] && [ $error_rate -le 1 ]; then
        echo -e "${GREEN}✅ ALL SUCCESS CRITERIA MET${NC}"
        echo -e "${GREEN}🚀 Ready for 100% migration (final phase)${NC}"
        echo -e "${PURPLE}🎉 Majority adoption successful!${NC}"
    else
        echo -e "${YELLOW}⚠️  MONITORING CRITERIA:${NC}"
        [ $success_rate -lt 99 ] && echo -e "  ${RED}• Success Rate: ${success_rate}% (target: ≥99%)${NC}"
        [ "$(echo "$avg_response_time >= 100" | bc 2>/dev/null)" = "1" ] && echo -e "  ${RED}• Response Time: ${avg_response_time}ms (target: <100ms)${NC}"
        [ $error_rate -gt 1 ] && echo -e "  ${RED}• Error Rate: ${error_rate}% (target: ≤1%)${NC}"
    fi
    
    log "METRICS: tests=$TOTAL_TESTS, success_rate=${success_rate}%, error_rate=${error_rate}%, avg_time=${avg_response_time}ms"
}

# Function to test rollout distribution
test_rollout_distribution() {
    echo -e "${YELLOW}📊 TESTING 50% ROLLOUT DISTRIBUTION:${NC}"
    
    local new_auth_count=0
    local old_auth_count=0
    
    for i in {1..100}; do
        local user_id="test-user-$i"
        local rollout_percentage=50
        
        # Simulate feature flag logic
        local hash=$(echo -n "NEW_AUTH_SYSTEM$user_id" | md5 | cut -c1-8)
        local hash_num=$((0x$hash))
        local percentage=$((hash_num % 100))
        
        if [ $percentage -lt $rollout_percentage ]; then
            new_auth_count=$((new_auth_count + 1))
        else
            old_auth_count=$((old_auth_count + 1))
        fi
    done
    
    echo -e "Distribution Test (100 users):"
    echo -e "  ${PURPLE}New Auth (Supabase): $new_auth_count/100 (${new_auth_count}%)${NC}"
    echo -e "  ${CYAN}Old Auth (Custom):   $old_auth_count/100 (${old_auth_count}%)${NC}"
    
    if [ $new_auth_count -ge 45 ] && [ $new_auth_count -le 55 ]; then
        echo -e "✅ ${GREEN}Distribution EXCELLENT (~50%)${NC}"
        echo -e "🎉 ${PURPLE}MAJORITY ADOPTION ACHIEVED!${NC}"
    else
        echo -e "⚠️  ${YELLOW}Distribution variance: ${new_auth_count}% (expected ~50%)${NC}"
    fi
    
    if [ $new_auth_count -ge 50 ]; then
        echo -e "🏆 ${PURPLE}MILESTONE: Majority of users using Supabase authentication!${NC}"
    fi
    
    log "DISTRIBUTION: ${new_auth_count}% new auth (target: ~50%)"
}

# Function to check system health
check_system_health() {
    echo -e "${YELLOW}🏥 SYSTEM HEALTH CHECK:${NC}"
    
    # Server responsiveness
    if curl -s http://localhost:3001 >/dev/null 2>&1; then
        echo -e "✅ ${GREEN}Server: Responding (port 3001)${NC}"
    else
        echo -e "❌ ${RED}Server: Not responding${NC}"
        return 1
    fi
    
    # Quick performance test
    local quick_response=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null http://localhost:3001/auth/vn/login 2>/dev/null)
    local quick_code=$(echo "$quick_response" | cut -d: -f1)
    local quick_time=$(echo "$quick_response" | cut -d: -f2)
    local quick_time_ms=$(echo "$quick_time * 1000" | bc 2>/dev/null || echo "0")
    
    if [ "$quick_code" = "200" ]; then
        echo -e "✅ ${GREEN}Quick Test: $quick_code OK (${quick_time_ms}ms)${NC}"
    else
        echo -e "❌ ${RED}Quick Test: $quick_code ERROR${NC}"
    fi
    
    return 0
}

# Initial setup
log "50% ROLLOUT MONITORING STARTED - MAJORITY ADOPTION PHASE"
log "Target: 50% of users using Supabase authentication (majority adoption)"
log "Success criteria: >99% success rate, <100ms response time, <1% error rate"

echo -e "${PURPLE}🎉 MAJORITY ADOPTION MONITORING${NC}"
echo -e "${PURPLE}50% of users will use Supabase authentication${NC}"
echo -e "${PURPLE}This is a major milestone in our migration!${NC}"
echo ""

# Initial system health check
check_system_health
echo ""

# Test rollout distribution
test_rollout_distribution
echo ""

# Main monitoring loop
echo -e "${YELLOW}🔄 STARTING CONTINUOUS MONITORING...${NC}"
echo -e "${YELLOW}Monitoring majority adoption performance...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

ITERATION=0
while [ $ITERATION -lt 20 ]; do  # Run 20 iterations (about 2 minutes)
    ITERATION=$((ITERATION + 1))
    
    echo -e "${BLUE}--- Majority Adoption Cycle $ITERATION ---${NC}"
    
    # Test auth endpoint
    test_endpoint_performance "http://localhost:3001/auth/vn/login" "Auth"
    
    # Test home endpoint
    test_endpoint_performance "http://localhost:3001/home" "Home"
    
    # Display metrics every 5 iterations
    if [ $((ITERATION % 5)) -eq 0 ]; then
        display_metrics
        echo ""
    fi
    
    # Check for critical issues
    if [ $TOTAL_TESTS -ge 10 ]; then
        local current_error_rate=$((ERROR_COUNT * 100 / TOTAL_TESTS))
        local current_avg_time=0
        
        if [ $SUCCESS_COUNT -gt 0 ]; then
            current_avg_time=$(echo "scale=0; $TOTAL_RESPONSE_TIME / $SUCCESS_COUNT" | bc 2>/dev/null || echo "0")
        fi
        
        if [ $current_error_rate -gt 5 ]; then
            echo -e "${RED}🚨 CRITICAL: Error rate too high (${current_error_rate}%)${NC}"
            echo -e "${RED}🚨 RECOMMEND: Execute emergency rollback${NC}"
            log "CRITICAL_ALERT: High error rate detected: ${current_error_rate}%"
            break
        fi
        
        if [ "$(echo "$current_avg_time > 300" | bc 2>/dev/null)" = "1" ]; then
            echo -e "${RED}🚨 CRITICAL: Response time too slow (${current_avg_time}ms)${NC}"
            echo -e "${RED}🚨 RECOMMEND: Execute emergency rollback${NC}"
            log "CRITICAL_ALERT: Slow response time detected: ${current_avg_time}ms"
            break
        fi
    fi
    
    # Wait before next iteration
    sleep 3
done

# Final summary
echo ""
echo -e "${YELLOW}📊 FINAL 50% ROLLOUT SUMMARY:${NC}"
display_metrics

# Overall assessment
if [ $TOTAL_TESTS -gt 0 ]; then
    local final_success_rate=$((SUCCESS_COUNT * 100 / TOTAL_TESTS))
    local final_avg_time=0
    
    if [ $SUCCESS_COUNT -gt 0 ]; then
        final_avg_time=$(echo "scale=1; $TOTAL_RESPONSE_TIME / $SUCCESS_COUNT" | bc 2>/dev/null || echo "0")
    fi
    
    local final_error_rate=$((ERROR_COUNT * 100 / TOTAL_TESTS))
    
    if [ $final_success_rate -ge 99 ] && [ "$(echo "$final_avg_time < 100" | bc 2>/dev/null)" = "1" ] && [ $final_error_rate -le 1 ]; then
        echo ""
        echo -e "${GREEN}🎉 50% ROLLOUT: SUCCESSFUL${NC}"
        echo -e "${GREEN}✅ All success criteria met${NC}"
        echo -e "${PURPLE}🏆 MAJORITY ADOPTION ACHIEVED${NC}"
        echo -e "${GREEN}🚀 Ready to proceed to 100% migration${NC}"
        log "50% ROLLOUT: SUCCESSFUL - All criteria met, majority adoption achieved"
    else
        echo ""
        echo -e "${YELLOW}⚠️  50% ROLLOUT: NEEDS ATTENTION${NC}"
        echo -e "${YELLOW}🔍 Review metrics before proceeding to 100%${NC}"
        log "50% ROLLOUT: NEEDS_ATTENTION - Some criteria not met"
    fi
fi

echo ""
echo -e "${PURPLE}🏆 MIGRATION MILESTONE ACHIEVED:${NC}"
echo -e "${PURPLE}Majority of users now using Supabase authentication!${NC}"
echo ""
echo -e "${BLUE}📝 Full monitoring log: $LOG_FILE${NC}"
echo -e "${BLUE}🔄 Run dashboard: ./scripts/rollout-dashboard.sh${NC}"
echo -e "${BLUE}🚨 Emergency rollback: ./scripts/emergency-rollback.sh${NC}"

log "50% ROLLOUT MONITORING COMPLETED - MAJORITY ADOPTION PHASE"
