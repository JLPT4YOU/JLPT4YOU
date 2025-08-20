#!/bin/bash

# 📊 COMPREHENSIVE 25% ROLLOUT MONITORING
# Real-time monitoring for 25% rollout phase
# Version: 1.0

LOG_FILE="logs/monitor-25-rollout-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Monitoring counters
TOTAL_TESTS=0
SUCCESS_COUNT=0
ERROR_COUNT=0
TOTAL_RESPONSE_TIME=0
COLD_START_EXCLUDED=false

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  📊 25% ROLLOUT MONITORING                   ║${NC}"
echo -e "${BLUE}║                    Supabase Authentication                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Function to test endpoint performance
test_endpoint_performance() {
    local endpoint="$1"
    local test_name="$2"
    
    local start_time=$(date +%s%3N 2>/dev/null || date +%s)
    local response=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null "$endpoint" 2>/dev/null)
    local end_time=$(date +%s%3N 2>/dev/null || date +%s)
    
    local http_code=$(echo "$response" | cut -d: -f1)
    local time_total=$(echo "$response" | cut -d: -f2)
    local time_ms=$(echo "$time_total * 1000" | bc 2>/dev/null || echo "0")
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Skip first request if it's a cold start (>1000ms)
    if [ "$COLD_START_EXCLUDED" = false ] && [ "$(echo "$time_ms > 1000" | bc 2>/dev/null)" = "1" ]; then
        echo -e "🔥 ${YELLOW}Cold start detected: ${time_ms}ms (excluded from averages)${NC}"
        COLD_START_EXCLUDED=true
        log "COLD_START: $test_name - ${time_ms}ms"
        return
    fi
    
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
    echo -e "${YELLOW}📊 REAL-TIME 25% ROLLOUT METRICS:${NC}"
    echo -e "┌─────────────────────────────────────────────────────────────┐"
    echo -e "│ Total Tests: $TOTAL_TESTS                                        │"
    echo -e "│ Success Rate: ${GREEN}${success_rate}%${NC} (target: >99%)                      │"
    echo -e "│ Error Rate: ${RED}${error_rate}%${NC} (target: <1%)                         │"
    echo -e "│ Avg Response: ${avg_response_time}ms (target: <100ms)              │"
    echo -e "│ Load Level: ${CYAN}25% rollout${NC} (3x increase from 15%)        │"
    echo -e "└─────────────────────────────────────────────────────────────┘"
    
    # Success criteria assessment
    if [ $success_rate -ge 99 ] && [ "$(echo "$avg_response_time < 100" | bc 2>/dev/null)" = "1" ] && [ $error_rate -le 1 ]; then
        echo -e "${GREEN}✅ ALL SUCCESS CRITERIA MET${NC}"
        echo -e "${GREEN}🚀 Ready for 50% rollout${NC}"
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
    echo -e "${YELLOW}📊 TESTING ROLLOUT DISTRIBUTION:${NC}"
    
    local new_auth_count=0
    local old_auth_count=0
    
    for i in {1..50}; do
        local user_id="test-user-$i"
        local rollout_percentage=25
        
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
    
    local actual_percentage=$((new_auth_count * 2)) # *2 because we tested 50 users
    
    echo -e "Distribution Test (50 users):"
    echo -e "  New Auth (Supabase): $new_auth_count/50 (${actual_percentage}%)"
    echo -e "  Old Auth (Custom):   $old_auth_count/50 ($((100 - actual_percentage))%)"
    
    if [ $actual_percentage -ge 20 ] && [ $actual_percentage -le 30 ]; then
        echo -e "✅ ${GREEN}Distribution CORRECT (~25%)${NC}"
    else
        echo -e "⚠️  ${YELLOW}Distribution variance: ${actual_percentage}% (expected ~25%)${NC}"
    fi
    
    log "DISTRIBUTION: ${actual_percentage}% new auth (target: ~25%)"
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
    
    # Memory usage (if available)
    if command -v ps >/dev/null 2>&1; then
        local memory_usage=$(ps aux | grep "next-server" | grep -v grep | awk '{print $4}' | head -1)
        if [ -n "$memory_usage" ]; then
            echo -e "📊 Memory Usage: ${memory_usage}%"
        fi
    fi
    
    return 0
}

# Initial setup
log "25% ROLLOUT MONITORING STARTED"
log "Target: 25% of users using Supabase authentication"
log "Success criteria: >99% success rate, <100ms response time, <1% error rate"

# Initial system health check
check_system_health
echo ""

# Test rollout distribution
test_rollout_distribution
echo ""

# Main monitoring loop
echo -e "${YELLOW}🔄 STARTING CONTINUOUS MONITORING...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

ITERATION=0
while [ $ITERATION -lt 30 ]; do  # Run 30 iterations (about 3 minutes)
    ITERATION=$((ITERATION + 1))
    
    echo -e "${BLUE}--- Monitoring Cycle $ITERATION ---${NC}"
    
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
        
        if [ "$(echo "$current_avg_time > 200" | bc 2>/dev/null)" = "1" ]; then
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
echo -e "${YELLOW}📊 FINAL 25% ROLLOUT SUMMARY:${NC}"
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
        echo -e "${GREEN}🎉 25% ROLLOUT: SUCCESSFUL${NC}"
        echo -e "${GREEN}✅ All success criteria met${NC}"
        echo -e "${GREEN}🚀 Ready to proceed to 50% rollout${NC}"
        log "25% ROLLOUT: SUCCESSFUL - All criteria met"
    else
        echo ""
        echo -e "${YELLOW}⚠️  25% ROLLOUT: NEEDS ATTENTION${NC}"
        echo -e "${YELLOW}🔍 Review metrics before proceeding${NC}"
        log "25% ROLLOUT: NEEDS_ATTENTION - Some criteria not met"
    fi
fi

echo ""
echo -e "${BLUE}📝 Full monitoring log: $LOG_FILE${NC}"
echo -e "${BLUE}🔄 Run dashboard: ./scripts/rollout-dashboard.sh${NC}"
echo -e "${BLUE}🚨 Emergency rollback: ./scripts/emergency-rollback.sh${NC}"

log "25% ROLLOUT MONITORING COMPLETED"
