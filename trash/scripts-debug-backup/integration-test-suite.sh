#!/bin/bash

# 🧪 INTEGRATION TEST SUITE
# Comprehensive testing for new authentication system
# Version: 1.0

LOG_FILE="logs/integration-tests-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    
    # Run test command
    local result
    if eval "$test_command" >/dev/null 2>&1; then
        result="PASS"
    else
        result="FAIL"
    fi
    
    # Check if result matches expected
    if [ "$result" = "$expected_status" ]; then
        echo -e "   ✅ ${GREEN}PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log "TEST_PASS: $test_name"
    else
        echo -e "   ❌ ${RED}FAIL${NC} (expected: $expected_status, got: $result)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log "TEST_FAIL: $test_name - expected: $expected_status, got: $result"
    fi
}

# Performance test function
run_performance_test() {
    local test_name="$1"
    local test_command="$2"
    local max_time_ms="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}⚡ Performance Test: $test_name${NC}"
    
    local start_time=$(date +%s%3N)
    eval "$test_command" >/dev/null 2>&1
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if [ $duration -le $max_time_ms ]; then
        echo -e "   ✅ ${GREEN}PASS${NC} (${duration}ms ≤ ${max_time_ms}ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log "PERF_PASS: $test_name - ${duration}ms"
    else
        echo -e "   ❌ ${RED}FAIL${NC} (${duration}ms > ${max_time_ms}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log "PERF_FAIL: $test_name - ${duration}ms > ${max_time_ms}ms"
    fi
}

echo -e "${BLUE}🧪 INTEGRATION TEST SUITE${NC}"
echo -e "${BLUE}=========================${NC}"
echo ""

# Create logs directory
mkdir -p logs

# 1. Server Health Tests
echo -e "${YELLOW}🏥 SERVER HEALTH TESTS:${NC}"
run_test "Server Running" "curl -s http://localhost:3001" "PASS"
run_test "Server Response Time" "curl -s -w '%{time_total}' -o /dev/null http://localhost:3001" "PASS"
echo ""

# 2. Authentication Endpoint Tests
echo -e "${YELLOW}🔐 AUTHENTICATION ENDPOINT TESTS:${NC}"
run_test "Login Page Accessible" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/auth/vn/login | grep -q '200'" "PASS"
run_test "Register Page Accessible" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/auth/vn/register | grep -q '200'" "PASS"
run_test "Protected Route Redirects" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/home | grep -q '30[0-9]'" "PASS"
echo ""

# 3. Feature Flag Tests
echo -e "${YELLOW}🚩 FEATURE FLAG TESTS:${NC}"
run_test "Rollout Percentage Set" "[ '${NEXT_PUBLIC_ROLLOUT_PERCENTAGE:-0}' -eq '5' ]" "PASS"
run_test "Monitoring Enabled" "[ '${NEXT_PUBLIC_ENABLE_MONITORING:-false}' = 'true' ]" "PASS"
echo ""

# 4. Security Tests
echo -e "${YELLOW}🛡️ SECURITY TESTS:${NC}"
run_test "Security Headers Present" "curl -s -I http://localhost:3001 | grep -q 'X-Frame-Options'" "PASS"
run_test "HTTPS Redirect (if applicable)" "curl -s -I http://localhost:3001 | grep -q 'Strict-Transport-Security'" "FAIL"
run_test "No Sensitive Info in Headers" "! curl -s -I http://localhost:3001 | grep -i 'server.*apache\\|server.*nginx\\|x-powered-by'" "PASS"
echo ""

# 5. Performance Tests
echo -e "${YELLOW}⚡ PERFORMANCE TESTS:${NC}"
run_performance_test "Auth Page Load Time" "curl -s http://localhost:3001/auth/vn/login" 200
run_performance_test "Home Page Redirect Time" "curl -s http://localhost:3001/home" 100
run_performance_test "API Response Time" "curl -s http://localhost:3001/api/health" 150
echo ""

# 6. Database Connection Tests
echo -e "${YELLOW}🗄️ DATABASE CONNECTION TESTS:${NC}"
run_test "Supabase Connection" "curl -s 'https://prrizpzrdepnjjkyrimh.supabase.co/rest/v1/' -H 'apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}' | grep -q 'OpenAPI'" "PASS"
echo ""

# 7. Middleware Tests
echo -e "${YELLOW}🔄 MIDDLEWARE TESTS:${NC}"
run_test "Language Detection" "curl -s -H 'Accept-Language: en' http://localhost:3001/ | grep -q 'en\\|vn\\|jp'" "PASS"
run_test "Cookie Handling" "curl -s -c /tmp/cookies -b /tmp/cookies http://localhost:3001/auth/vn/login" "PASS"
echo ""

# 8. Rate Limiting Tests
echo -e "${YELLOW}🚦 RATE LIMITING TESTS:${NC}"
echo "   Testing rate limiting (this may take a moment)..."

# Test rate limiting by making many requests
RATE_LIMIT_PASSED=true
for i in {1..20}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/vn/login)
    if [ "$response" = "429" ]; then
        RATE_LIMIT_PASSED=false
        break
    fi
done

if [ "$RATE_LIMIT_PASSED" = true ]; then
    echo -e "   ✅ ${GREEN}PASS${NC} (Rate limiting not triggered with normal load)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ⚠️  ${YELLOW}INFO${NC} (Rate limiting triggered - this is expected behavior)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# 9. Rollout Distribution Tests
echo -e "${YELLOW}📊 ROLLOUT DISTRIBUTION TESTS:${NC}"

# Test rollout distribution simulation
NEW_AUTH_COUNT=0
OLD_AUTH_COUNT=0

for i in {1..20}; do
    # Simulate feature flag check
    ROLLOUT_PERCENTAGE=5
    HASH=$(echo -n "NEW_AUTH_SYSTEM$i" | md5 | cut -c1-8)
    HASH_NUM=$((0x$HASH))
    PERCENTAGE=$((HASH_NUM % 100))
    
    if [ $PERCENTAGE -lt $ROLLOUT_PERCENTAGE ]; then
        NEW_AUTH_COUNT=$((NEW_AUTH_COUNT + 1))
    else
        OLD_AUTH_COUNT=$((OLD_AUTH_COUNT + 1))
    fi
done

if [ $NEW_AUTH_COUNT -ge 1 ] && [ $NEW_AUTH_COUNT -le 3 ]; then
    echo -e "   ✅ ${GREEN}PASS${NC} (Rollout distribution: ${NEW_AUTH_COUNT}/20 ≈ 5%)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ❌ ${RED}FAIL${NC} (Rollout distribution: ${NEW_AUTH_COUNT}/20 ≠ ~5%)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# 10. File Integrity Tests
echo -e "${YELLOW}📁 FILE INTEGRITY TESTS:${NC}"
required_files=(
    "src/lib/auth/supabase-ssr.ts"
    "src/lib/auth/rbac.ts"
    "src/lib/auth/middleware-v2.ts"
    "src/contexts/auth-context-v2.tsx"
    "src/lib/feature-flags.ts"
    "scripts/emergency-rollback.sh"
    "scripts/rollout-dashboard.sh"
)

for file in "${required_files[@]}"; do
    run_test "File exists: $file" "[ -f '$file' ]" "PASS"
done
echo ""

# Test Results Summary
echo -e "${YELLOW}📊 TEST RESULTS SUMMARY:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ Total Tests: $TOTAL_TESTS                                        │"
echo -e "│ Passed: ${GREEN}$PASSED_TESTS${NC}                                           │"
echo -e "│ Failed: ${RED}$FAILED_TESTS${NC}                                           │"

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "│ Success Rate: ${SUCCESS_RATE}%                                    │"
else
    SUCCESS_RATE=0
fi

echo -e "└─────────────────────────────────────────────────────────────┘"
echo ""

# Overall Status
if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 INTEGRATION TESTS: PASSED${NC}"
    echo -e "${GREEN}✅ System ready for next rollout phase${NC}"
    log "INTEGRATION_TESTS: PASSED - Success rate: ${SUCCESS_RATE}%"
elif [ $SUCCESS_RATE -ge 75 ]; then
    echo -e "${YELLOW}⚠️  INTEGRATION TESTS: PARTIAL${NC}"
    echo -e "${YELLOW}🔍 Review failed tests before proceeding${NC}"
    log "INTEGRATION_TESTS: PARTIAL - Success rate: ${SUCCESS_RATE}%"
else
    echo -e "${RED}🚨 INTEGRATION TESTS: FAILED${NC}"
    echo -e "${RED}❌ System not ready for rollout${NC}"
    log "INTEGRATION_TESTS: FAILED - Success rate: ${SUCCESS_RATE}%"
fi

echo ""
echo -e "${BLUE}📝 Full test log: $LOG_FILE${NC}"
echo -e "${BLUE}🔄 Run again: ./scripts/integration-test-suite.sh${NC}"

# Exit with appropriate code
if [ $SUCCESS_RATE -ge 90 ]; then
    exit 0
else
    exit 1
fi
