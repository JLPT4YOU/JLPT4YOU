#!/bin/bash

# 📊 MONITOR ROLLOUT METRICS SCRIPT
# Continuously monitors system performance during 5% rollout
# Version: 1.0

LOG_FILE="logs/rollout-monitoring-$(date +%Y%m%d-%H%M%S).log"

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

echo -e "${BLUE}📊 MONITORING 5% ROLLOUT METRICS${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Initialize counters
TOTAL_REQUESTS=0
SUCCESS_COUNT=0
ERROR_COUNT=0
NEW_AUTH_COUNT=0
OLD_AUTH_COUNT=0
TOTAL_RESPONSE_TIME=0

echo -e "${YELLOW}🔄 Starting continuous monitoring...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Function to test authentication endpoint
test_auth_endpoint() {
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/auth/vn/login 2>/dev/null)
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    TOTAL_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME + response_time))
    
    if [ "$response" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -e "✅ Auth endpoint: ${GREEN}200 OK${NC} (${response_time}ms)"
    else
        ERROR_COUNT=$((ERROR_COUNT + 1))
        echo -e "❌ Auth endpoint: ${RED}$response${NC} (${response_time}ms)"
    fi
    
    # Log detailed metrics
    log "AUTH_TEST: status=$response, time=${response_time}ms, total_requests=$TOTAL_REQUESTS"
}

# Function to test home endpoint (protected)
test_home_endpoint() {
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/home 2>/dev/null)
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response" = "200" ] || [ "$response" = "302" ]; then
        echo -e "✅ Home endpoint: ${GREEN}$response${NC} (${response_time}ms)"
    else
        echo -e "❌ Home endpoint: ${RED}$response${NC} (${response_time}ms)"
    fi
    
    log "HOME_TEST: status=$response, time=${response_time}ms"
}

# Function to display metrics
display_metrics() {
    local avg_response_time=0
    if [ $TOTAL_REQUESTS -gt 0 ]; then
        avg_response_time=$((TOTAL_RESPONSE_TIME / TOTAL_REQUESTS))
    fi
    
    local success_rate=0
    if [ $TOTAL_REQUESTS -gt 0 ]; then
        success_rate=$((SUCCESS_COUNT * 100 / TOTAL_REQUESTS))
    fi
    
    local error_rate=$((ERROR_COUNT * 100 / TOTAL_REQUESTS))
    
    echo ""
    echo -e "${YELLOW}📊 CURRENT METRICS:${NC}"
    echo -e "Total Requests: $TOTAL_REQUESTS"
    echo -e "Success Rate: ${GREEN}${success_rate}%${NC}"
    echo -e "Error Rate: ${RED}${error_rate}%${NC}"
    echo -e "Avg Response Time: ${avg_response_time}ms"
    echo ""
    
    # Check success criteria
    if [ $success_rate -ge 99 ] && [ $avg_response_time -le 200 ]; then
        echo -e "${GREEN}✅ SUCCESS CRITERIA MET${NC}"
    else
        echo -e "${YELLOW}⚠️  Monitoring criteria:${NC}"
        echo -e "  Success Rate: ${success_rate}% (target: ≥99%)"
        echo -e "  Avg Response: ${avg_response_time}ms (target: ≤200ms)"
    fi
    
    log "METRICS: requests=$TOTAL_REQUESTS, success_rate=${success_rate}%, error_rate=${error_rate}%, avg_time=${avg_response_time}ms"
}

# Function to check rollout status
check_rollout_status() {
    echo -e "${YELLOW}🚩 ROLLOUT STATUS:${NC}"
    echo "Rollout Percentage: ${NEXT_PUBLIC_ROLLOUT_PERCENTAGE:-0}%"
    echo "Monitoring Enabled: ${NEXT_PUBLIC_ENABLE_MONITORING:-false}"
    echo "Debug Logs: ${NEXT_PUBLIC_ENABLE_DEBUG_LOGS:-false}"
    echo ""
}

# Trap Ctrl+C to display final metrics
trap 'echo ""; echo "📊 FINAL METRICS:"; display_metrics; echo "📝 Full log: $LOG_FILE"; exit 0' INT

# Initial status check
check_rollout_status

# Main monitoring loop
ITERATION=0
while true; do
    ITERATION=$((ITERATION + 1))
    
    echo -e "${BLUE}--- Iteration $ITERATION ---${NC}"
    
    # Test authentication endpoints
    test_auth_endpoint
    test_home_endpoint
    
    # Display metrics every 5 iterations
    if [ $((ITERATION % 5)) -eq 0 ]; then
        display_metrics
    fi
    
    # Check for critical issues
    if [ $TOTAL_REQUESTS -ge 10 ]; then
        local error_rate=$((ERROR_COUNT * 100 / TOTAL_REQUESTS))
        local avg_response_time=$((TOTAL_RESPONSE_TIME / TOTAL_REQUESTS))
        
        if [ $error_rate -gt 5 ]; then
            echo -e "${RED}🚨 CRITICAL: Error rate too high (${error_rate}%)${NC}"
            echo -e "${RED}Consider running emergency rollback!${NC}"
            log "CRITICAL: High error rate detected: ${error_rate}%"
        fi
        
        if [ $avg_response_time -gt 500 ]; then
            echo -e "${RED}🚨 CRITICAL: Response time too slow (${avg_response_time}ms)${NC}"
            echo -e "${RED}Consider running emergency rollback!${NC}"
            log "CRITICAL: Slow response time detected: ${avg_response_time}ms"
        fi
    fi
    
    # Wait before next iteration
    sleep 3
done
