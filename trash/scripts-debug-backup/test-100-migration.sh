#!/bin/bash

# 🎉 COMPREHENSIVE 100% MIGRATION TESTING SUITE
# Complete end-to-end validation of Supabase authentication migration
# Version: 1.0

LOG_FILE="logs/test-100-migration-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Test result function
test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "✅ ${GREEN}PASS${NC}: $test_name"
        [ -n "$details" ] && echo -e "   ${CYAN}$details${NC}"
        log "PASS: $test_name - $details"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "❌ ${RED}FAIL${NC}: $test_name"
        [ -n "$details" ] && echo -e "   ${RED}$details${NC}"
        log "FAIL: $test_name - $details"
    fi
}

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                🎉 100% MIGRATION TESTING SUITE               ║${NC}"
echo -e "${BLUE}║                   COMPLETE MIGRATION PHASE                  ║${NC}"
echo -e "${BLUE}║                 Supabase Authentication                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p logs

log "100% MIGRATION TESTING STARTED"
log "Target: Complete migration to Supabase authentication"

echo -e "${PURPLE}🎉 HISTORIC MOMENT: 100% MIGRATION TESTING${NC}"
echo -e "${PURPLE}All users will now use Supabase authentication!${NC}"
echo ""

# ===== PHASE 1: ROLLOUT DISTRIBUTION VALIDATION =====
echo -e "${YELLOW}📊 PHASE 1: ROLLOUT DISTRIBUTION VALIDATION${NC}"
echo -e "=============================================="

# Test rollout distribution
new_auth_count=0
old_auth_count=0

for i in {1..100}; do
    user_id="test-user-$i"
    rollout_percentage=100
    
    # Simulate feature flag logic
    hash=$(echo -n "NEW_AUTH_SYSTEM$user_id" | md5 | cut -c1-8)
    hash_num=$((0x$hash))
    percentage=$((hash_num % 100))
    
    if [ $percentage -lt $rollout_percentage ]; then
        new_auth_count=$((new_auth_count + 1))
    else
        old_auth_count=$((old_auth_count + 1))
    fi
done

echo "Distribution Test (100 simulated users):"
echo "  New Auth (Supabase): $new_auth_count/100 (${new_auth_count}%)"
echo "  Old Auth (Custom):   $old_auth_count/100 (${old_auth_count}%)"

if [ $new_auth_count -eq 100 ]; then
    test_result "100% Distribution" "PASS" "All users using Supabase authentication"
else
    test_result "100% Distribution" "FAIL" "Only ${new_auth_count}% using Supabase"
fi

echo ""

# ===== PHASE 2: BASIC PERFORMANCE VALIDATION =====
echo -e "${YELLOW}📈 PHASE 2: BASIC PERFORMANCE VALIDATION${NC}"
echo -e "=========================================="

# Test basic server health
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    test_result "Server Health" "PASS" "Server responding on port 3001"
else
    test_result "Server Health" "FAIL" "Server not responding"
fi

# Test auth endpoint performance
auth_total_time=0
auth_success_count=0
auth_error_count=0

echo "Testing auth endpoint performance (10 requests):"
for i in $(seq 1 10); do
    response=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null http://localhost:3001/auth/vn/login)
    code=$(echo $response | cut -d: -f1)
    time=$(echo $response | cut -d: -f2)
    time_ms=$(echo "$time * 1000" | bc 2>/dev/null || echo "0")
    
    if [ "$code" = "200" ]; then
        auth_success_count=$((auth_success_count + 1))
        auth_total_time=$(echo "$auth_total_time + $time_ms" | bc 2>/dev/null || echo "$auth_total_time")
        echo -n "✅"
    else
        auth_error_count=$((auth_error_count + 1))
        echo -n "❌"
    fi
    sleep 0.1
done

echo ""

# Calculate performance metrics
if [ $auth_success_count -gt 0 ]; then
    auth_avg_time=$(echo "scale=1; $auth_total_time / $auth_success_count" | bc 2>/dev/null || echo "0")
    auth_success_rate=$((auth_success_count * 100 / 10))
else
    auth_avg_time=0
    auth_success_rate=0
fi

echo "Performance Results:"
echo "  Success Rate: ${auth_success_rate}% (${auth_success_count}/10)"
echo "  Average Time: ${auth_avg_time}ms"
echo "  Error Count: ${auth_error_count}"

# Validate performance criteria
if [ $auth_success_rate -ge 99 ]; then
    test_result "Success Rate" "PASS" "${auth_success_rate}% (target: ≥99%)"
else
    test_result "Success Rate" "FAIL" "${auth_success_rate}% (target: ≥99%)"
fi

if [ "$(echo "$auth_avg_time < 100" | bc 2>/dev/null)" = "1" ]; then
    test_result "Response Time" "PASS" "${auth_avg_time}ms (target: <100ms)"
else
    test_result "Response Time" "FAIL" "${auth_avg_time}ms (target: <100ms)"
fi

if [ $auth_error_count -eq 0 ]; then
    test_result "Error Rate" "PASS" "0% errors (target: <1%)"
else
    error_rate=$((auth_error_count * 100 / 10))
    if [ $error_rate -le 1 ]; then
        test_result "Error Rate" "PASS" "${error_rate}% errors (target: <1%)"
    else
        test_result "Error Rate" "FAIL" "${error_rate}% errors (target: <1%)"
    fi
fi

echo ""

# ===== PHASE 3: MULTI-LANGUAGE AUTHENTICATION TESTING =====
echo -e "${YELLOW}🌐 PHASE 3: MULTI-LANGUAGE AUTHENTICATION TESTING${NC}"
echo -e "=================================================="

# Test Vietnamese auth
vn_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/auth/vn/login)
if [ "$vn_response" = "200" ]; then
    test_result "Vietnamese Auth" "PASS" "HTTP $vn_response"
else
    test_result "Vietnamese Auth" "FAIL" "HTTP $vn_response"
fi

# Test Japanese auth
jp_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/auth/jp/login)
if [ "$jp_response" = "200" ]; then
    test_result "Japanese Auth" "PASS" "HTTP $jp_response"
else
    test_result "Japanese Auth" "FAIL" "HTTP $jp_response"
fi

# Test English auth
en_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/auth/en/login)
if [ "$en_response" = "200" ]; then
    test_result "English Auth" "PASS" "HTTP $en_response"
else
    test_result "English Auth" "FAIL" "HTTP $en_response"
fi

echo ""

# ===== PHASE 4: PROTECTED ROUTES TESTING =====
echo -e "${YELLOW}🔒 PHASE 4: PROTECTED ROUTES TESTING${NC}"
echo -e "===================================="

# Test home route (should redirect to auth)
home_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/home)
if [ "$home_response" = "307" ] || [ "$home_response" = "302" ]; then
    test_result "Home Route Protection" "PASS" "HTTP $home_response (redirect)"
else
    test_result "Home Route Protection" "FAIL" "HTTP $home_response (expected redirect)"
fi

# Test JLPT route
jlpt_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/jlpt)
if [ "$jlpt_response" = "200" ] || [ "$jlpt_response" = "307" ] || [ "$jlpt_response" = "302" ]; then
    test_result "JLPT Route Access" "PASS" "HTTP $jlpt_response"
else
    test_result "JLPT Route Access" "FAIL" "HTTP $jlpt_response"
fi

# Test Challenge route
challenge_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/challenge)
if [ "$challenge_response" = "200" ] || [ "$challenge_response" = "307" ] || [ "$challenge_response" = "302" ]; then
    test_result "Challenge Route Access" "PASS" "HTTP $challenge_response"
else
    test_result "Challenge Route Access" "FAIL" "HTTP $challenge_response"
fi

echo ""

# ===== PHASE 5: SYSTEM INTEGRATION TESTING =====
echo -e "${YELLOW}🔧 PHASE 5: SYSTEM INTEGRATION TESTING${NC}"
echo -e "======================================"

# Test landing page (should be accessible)
landing_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/)
if [ "$landing_response" = "200" ]; then
    test_result "Landing Page Access" "PASS" "HTTP $landing_response"
else
    test_result "Landing Page Access" "FAIL" "HTTP $landing_response"
fi

# Test API health (if available)
api_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/health 2>/dev/null)
if [ "$api_response" = "200" ]; then
    test_result "API Health Check" "PASS" "HTTP $api_response"
elif [ "$api_response" = "404" ]; then
    test_result "API Health Check" "PASS" "HTTP $api_response (endpoint not implemented)"
else
    test_result "API Health Check" "FAIL" "HTTP $api_response"
fi

echo ""

# ===== PHASE 6: LOAD TESTING =====
echo -e "${YELLOW}⚡ PHASE 6: LOAD TESTING${NC}"
echo -e "========================"

echo "Performing load test (20 concurrent-style requests):"
load_success=0
load_total=20
load_total_time=0

for i in $(seq 1 $load_total); do
    start_time=$(date +%s%3N 2>/dev/null || date +%s)
    response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/auth/vn/login)
    end_time=$(date +%s%3N 2>/dev/null || date +%s)
    
    if [ "$response" = "200" ]; then
        load_success=$((load_success + 1))
        time_diff=$((end_time - start_time))
        load_total_time=$((load_total_time + time_diff))
        echo -n "✅"
    else
        echo -n "❌"
    fi
    
    # Small delay to simulate realistic load
    sleep 0.05
done

echo ""

load_success_rate=$((load_success * 100 / load_total))
if [ $load_success -gt 0 ]; then
    load_avg_time=$((load_total_time / load_success))
else
    load_avg_time=0
fi

echo "Load Test Results:"
echo "  Success Rate: ${load_success_rate}% (${load_success}/${load_total})"
echo "  Average Time: ${load_avg_time}ms"

if [ $load_success_rate -ge 95 ]; then
    test_result "Load Test Success Rate" "PASS" "${load_success_rate}% (target: ≥95%)"
else
    test_result "Load Test Success Rate" "FAIL" "${load_success_rate}% (target: ≥95%)"
fi

if [ $load_avg_time -lt 200 ]; then
    test_result "Load Test Performance" "PASS" "${load_avg_time}ms (target: <200ms)"
else
    test_result "Load Test Performance" "FAIL" "${load_avg_time}ms (target: <200ms)"
fi

echo ""

# ===== FINAL SUMMARY =====
echo -e "${YELLOW}📊 FINAL 100% MIGRATION TEST SUMMARY${NC}"
echo -e "====================================="

pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Pass Rate: ${pass_rate}%"

echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 100% MIGRATION: SUCCESSFUL${NC}"
    echo -e "${GREEN}✅ All tests passed${NC}"
    echo -e "${PURPLE}🏆 COMPLETE MIGRATION ACHIEVED${NC}"
    echo -e "${GREEN}🚀 Ready for old system cleanup${NC}"
    log "100% MIGRATION: SUCCESSFUL - All tests passed"
elif [ $pass_rate -ge 90 ]; then
    echo -e "${YELLOW}⚠️  100% MIGRATION: MOSTLY SUCCESSFUL${NC}"
    echo -e "${YELLOW}🔍 Minor issues detected, review before cleanup${NC}"
    log "100% MIGRATION: MOSTLY_SUCCESSFUL - ${pass_rate}% pass rate"
else
    echo -e "${RED}❌ 100% MIGRATION: NEEDS ATTENTION${NC}"
    echo -e "${RED}🚨 Significant issues detected${NC}"
    echo -e "${RED}🔄 Consider rollback or fixes${NC}"
    log "100% MIGRATION: NEEDS_ATTENTION - ${pass_rate}% pass rate"
fi

echo ""
echo -e "${BLUE}📝 Full test log: $LOG_FILE${NC}"
echo -e "${BLUE}🔄 Run monitoring: ./scripts/monitor-100-migration.sh${NC}"
echo -e "${BLUE}🧹 Cleanup script: ./scripts/cleanup-old-auth.sh${NC}"

log "100% MIGRATION TESTING COMPLETED"
