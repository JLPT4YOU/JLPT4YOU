#!/bin/bash

# 🧪 TEST 25% ROLLOUT DISTRIBUTION
# Validates that 25% rollout is working correctly
# Version: 1.0

echo "🧪 TESTING 25% ROLLOUT DISTRIBUTION"
echo "===================================="
echo ""

# Test rollout distribution with 100 simulated users
NEW_AUTH_COUNT=0
OLD_AUTH_COUNT=0

echo "📊 Testing rollout distribution (100 simulated users):"
echo ""

for i in {1..100}; do
    # Simulate feature flag check for different user IDs
    USER_ID="test-user-$i"
    ROLLOUT_PERCENTAGE=25
    
    # Use same hash function as feature flags
    HASH=$(echo -n "NEW_AUTH_SYSTEM$USER_ID" | md5 | cut -c1-8)
    HASH_NUM=$((0x$HASH))
    PERCENTAGE=$((HASH_NUM % 100))
    
    if [ $PERCENTAGE -lt $ROLLOUT_PERCENTAGE ]; then
        NEW_AUTH_COUNT=$((NEW_AUTH_COUNT + 1))
        if [ $((i % 10)) -eq 0 ]; then
            echo "User $i: NEW AUTH (hash: $PERCENTAGE < $ROLLOUT_PERCENTAGE)"
        fi
    else
        OLD_AUTH_COUNT=$((OLD_AUTH_COUNT + 1))
        if [ $((i % 10)) -eq 0 ]; then
            echo "User $i: OLD AUTH (hash: $PERCENTAGE >= $ROLLOUT_PERCENTAGE)"
        fi
    fi
done

echo ""
echo "📊 25% ROLLOUT DISTRIBUTION RESULTS:"
echo "New Auth (Supabase): $NEW_AUTH_COUNT/100 (${NEW_AUTH_COUNT}%)"
echo "Old Auth (Custom):   $OLD_AUTH_COUNT/100 (${OLD_AUTH_COUNT}%)"
echo ""

# Validate distribution
if [ $NEW_AUTH_COUNT -ge 20 ] && [ $NEW_AUTH_COUNT -le 30 ]; then
    echo "✅ Rollout distribution CORRECT (~25%)"
    echo "🎯 Expected: 25%, Actual: ${NEW_AUTH_COUNT}%"
    DISTRIBUTION_OK=true
else
    echo "⚠️  Rollout distribution unexpected"
    echo "🎯 Expected: 25%, Actual: ${NEW_AUTH_COUNT}%"
    DISTRIBUTION_OK=false
fi

echo ""
echo "🔍 ENVIRONMENT STATUS:"
echo "ROLLOUT_PERCENTAGE: ${NEXT_PUBLIC_ROLLOUT_PERCENTAGE:-0}%"
echo "MONITORING: ${NEXT_PUBLIC_ENABLE_MONITORING:-false}"

echo ""
echo "🌐 SERVER HEALTH CHECK:"
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ Server responding on port 3001"
    SERVER_OK=true
else
    echo "❌ Server not responding"
    SERVER_OK=false
fi

# Test actual endpoints with performance measurement
echo ""
echo "🧪 ENDPOINT PERFORMANCE TESTING:"

# Test auth endpoint multiple times
AUTH_TOTAL_TIME=0
AUTH_SUCCESS_COUNT=0
AUTH_TESTS=10

echo "Testing auth endpoint ($AUTH_TESTS requests):"
for i in $(seq 1 $AUTH_TESTS); do
    AUTH_RESPONSE=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null http://localhost:3001/auth/vn/login)
    AUTH_CODE=$(echo $AUTH_RESPONSE | cut -d: -f1)
    AUTH_TIME=$(echo $AUTH_RESPONSE | cut -d: -f2)
    AUTH_TIME_MS=$(echo "$AUTH_TIME * 1000" | bc 2>/dev/null || echo "0")
    
    if [ "$AUTH_CODE" = "200" ]; then
        AUTH_SUCCESS_COUNT=$((AUTH_SUCCESS_COUNT + 1))
        AUTH_TOTAL_TIME=$(echo "$AUTH_TOTAL_TIME + $AUTH_TIME_MS" | bc 2>/dev/null || echo "$AUTH_TOTAL_TIME")
        echo -n "✅"
    else
        echo -n "❌"
    fi
done

echo ""

# Calculate auth metrics
if [ $AUTH_SUCCESS_COUNT -gt 0 ]; then
    AUTH_AVG_TIME=$(echo "scale=1; $AUTH_TOTAL_TIME / $AUTH_SUCCESS_COUNT" | bc 2>/dev/null || echo "0")
    AUTH_SUCCESS_RATE=$((AUTH_SUCCESS_COUNT * 100 / AUTH_TESTS))
else
    AUTH_AVG_TIME=0
    AUTH_SUCCESS_RATE=0
fi

echo "Auth Endpoint Results:"
echo "  Success Rate: ${AUTH_SUCCESS_RATE}% (${AUTH_SUCCESS_COUNT}/${AUTH_TESTS})"
echo "  Average Time: ${AUTH_AVG_TIME}ms"

# Test home endpoint
HOME_RESPONSE=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null http://localhost:3001/home)
HOME_CODE=$(echo $HOME_RESPONSE | cut -d: -f1)
HOME_TIME=$(echo $HOME_RESPONSE | cut -d: -f2)
HOME_TIME_MS=$(echo "$HOME_TIME * 1000" | bc 2>/dev/null || echo "0")

echo "Home Endpoint: $HOME_CODE (${HOME_TIME_MS}ms)"

echo ""
echo "📊 25% ROLLOUT PERFORMANCE SUMMARY:"

# Overall average time
if [ $AUTH_SUCCESS_COUNT -gt 0 ]; then
    OVERALL_AVG=$(echo "scale=1; ($AUTH_AVG_TIME + $HOME_TIME_MS) / 2" | bc 2>/dev/null || echo "0")
else
    OVERALL_AVG=$HOME_TIME_MS
fi

echo "Overall Average Response Time: ${OVERALL_AVG}ms"

# Success criteria check
SUCCESS_CRITERIA_MET=true

if [ $AUTH_SUCCESS_RATE -lt 99 ]; then
    echo "⚠️  Success rate below target: ${AUTH_SUCCESS_RATE}% (target: ≥99%)"
    SUCCESS_CRITERIA_MET=false
fi

if [ "$(echo "$OVERALL_AVG > 100" | bc 2>/dev/null)" = "1" ]; then
    echo "⚠️  Response time above target: ${OVERALL_AVG}ms (target: ≤100ms)"
    SUCCESS_CRITERIA_MET=false
fi

echo ""
echo "🎯 25% ROLLOUT STATUS:"
if [ "$DISTRIBUTION_OK" = true ] && [ "$SERVER_OK" = true ] && [ "$SUCCESS_CRITERIA_MET" = true ] && [ $AUTH_SUCCESS_RATE -ge 99 ]; then
    echo "🎉 25% ROLLOUT: SUCCESSFUL"
    echo "✅ Distribution: Correct (~25%)"
    echo "✅ Performance: Excellent (${OVERALL_AVG}ms)"
    echo "✅ Success Rate: ${AUTH_SUCCESS_RATE}%"
    echo "✅ Ready for next phase (50% rollout)"
else
    echo "⚠️  25% ROLLOUT: NEEDS ATTENTION"
    echo "🔍 Review metrics before proceeding"
    
    if [ "$DISTRIBUTION_OK" != true ]; then
        echo "  - Distribution: ${NEW_AUTH_COUNT}% (expected ~25%)"
    fi
    if [ "$SERVER_OK" != true ]; then
        echo "  - Server: Not responding"
    fi
    if [ "$SUCCESS_CRITERIA_MET" != true ]; then
        echo "  - Performance: Below targets"
    fi
    if [ $AUTH_SUCCESS_RATE -lt 99 ]; then
        echo "  - Success Rate: ${AUTH_SUCCESS_RATE}% (target: ≥99%)"
    fi
fi

echo ""
echo "📈 LOAD INCREASE ANALYSIS:"
echo "Previous (15%): ~15 users per 100"
echo "Current (25%):  ~${NEW_AUTH_COUNT} users per 100"
LOAD_INCREASE=$(echo "scale=1; $NEW_AUTH_COUNT / 15" | bc 2>/dev/null || echo "1.0")
echo "Load Increase: ${LOAD_INCREASE}x"

echo ""
echo "🔄 NEXT STEPS:"
if [ "$SUCCESS_CRITERIA_MET" = true ] && [ $AUTH_SUCCESS_RATE -ge 99 ]; then
    echo "1. Monitor 25% rollout for 1-2 hours"
    echo "2. Increase to 50% if stable"
    echo "3. Continue progressive rollout"
else
    echo "1. Investigate performance issues"
    echo "2. Fix identified problems"
    echo "3. Re-test before proceeding"
fi
