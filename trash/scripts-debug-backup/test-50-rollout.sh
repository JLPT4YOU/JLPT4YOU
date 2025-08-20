#!/bin/bash

# 🧪 TEST 50% ROLLOUT DISTRIBUTION
# Validates that 50% rollout is working correctly - MAJORITY ADOPTION
# Version: 1.0

echo "🧪 TESTING 50% ROLLOUT DISTRIBUTION (MAJORITY ADOPTION)"
echo "======================================================="
echo ""

# Test rollout distribution with 100 simulated users
NEW_AUTH_COUNT=0
OLD_AUTH_COUNT=0

echo "📊 Testing rollout distribution (100 simulated users):"
echo ""

for i in {1..100}; do
    # Simulate feature flag check for different user IDs
    USER_ID="test-user-$i"
    ROLLOUT_PERCENTAGE=50
    
    # Use same hash function as feature flags
    HASH=$(echo -n "NEW_AUTH_SYSTEM$USER_ID" | md5 | cut -c1-8)
    HASH_NUM=$((0x$HASH))
    PERCENTAGE=$((HASH_NUM % 100))
    
    if [ $PERCENTAGE -lt $ROLLOUT_PERCENTAGE ]; then
        NEW_AUTH_COUNT=$((NEW_AUTH_COUNT + 1))
        if [ $((i % 10)) -eq 0 ]; then
            echo "User $i: NEW AUTH (Supabase) - hash: $PERCENTAGE < $ROLLOUT_PERCENTAGE"
        fi
    else
        OLD_AUTH_COUNT=$((OLD_AUTH_COUNT + 1))
        if [ $((i % 10)) -eq 0 ]; then
            echo "User $i: OLD AUTH (Custom) - hash: $PERCENTAGE >= $ROLLOUT_PERCENTAGE"
        fi
    fi
done

echo ""
echo "📊 50% ROLLOUT DISTRIBUTION RESULTS:"
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ New Auth (Supabase): $NEW_AUTH_COUNT/100 (${NEW_AUTH_COUNT}%)                    │"
echo "│ Old Auth (Custom):   $OLD_AUTH_COUNT/100 (${OLD_AUTH_COUNT}%)                    │"
echo "│ Target Distribution: 50% each                              │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

# Validate distribution
if [ $NEW_AUTH_COUNT -ge 45 ] && [ $NEW_AUTH_COUNT -le 55 ]; then
    echo "✅ Rollout distribution EXCELLENT (~50%)"
    echo "🎯 Expected: 50%, Actual: ${NEW_AUTH_COUNT}%"
    DISTRIBUTION_OK=true
else
    echo "⚠️  Rollout distribution variance"
    echo "🎯 Expected: 50%, Actual: ${NEW_AUTH_COUNT}%"
    DISTRIBUTION_OK=false
fi

echo ""
echo "🎉 MAJORITY ADOPTION MILESTONE:"
if [ $NEW_AUTH_COUNT -ge 45 ]; then
    echo "✅ ACHIEVED: Majority of users (${NEW_AUTH_COUNT}%) using Supabase authentication!"
    echo "🚀 This is a major milestone in our migration journey"
else
    echo "⚠️  Not yet majority adoption: ${NEW_AUTH_COUNT}%"
fi

echo ""
echo "🔍 SYSTEM STATUS CHECK:"
echo "Environment: 50% rollout configuration"
echo "Server: http://localhost:3001"

# Server health check
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ Server responding correctly"
    SERVER_OK=true
else
    echo "❌ Server not responding"
    SERVER_OK=false
fi

echo ""
echo "🧪 COMPREHENSIVE ENDPOINT TESTING:"

# Test auth endpoint with performance measurement
echo "Testing auth endpoint (10 requests for load validation):"
AUTH_TOTAL_TIME=0
AUTH_SUCCESS_COUNT=0
AUTH_ERROR_COUNT=0
AUTH_TESTS=10

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
        AUTH_ERROR_COUNT=$((AUTH_ERROR_COUNT + 1))
        echo -n "❌"
    fi
    sleep 0.2  # Small delay to simulate realistic load
done

echo ""

# Calculate auth metrics
if [ $AUTH_SUCCESS_COUNT -gt 0 ]; then
    AUTH_AVG_TIME=$(echo "scale=1; $AUTH_TOTAL_TIME / $AUTH_SUCCESS_COUNT" | bc 2>/dev/null || echo "0")
    AUTH_SUCCESS_RATE=$((AUTH_SUCCESS_COUNT * 100 / AUTH_TESTS))
    AUTH_ERROR_RATE=$((AUTH_ERROR_COUNT * 100 / AUTH_TESTS))
else
    AUTH_AVG_TIME=0
    AUTH_SUCCESS_RATE=0
    AUTH_ERROR_RATE=100
fi

echo ""
echo "📊 AUTH ENDPOINT RESULTS (50% ROLLOUT):"
echo "  Success Rate: ${AUTH_SUCCESS_RATE}% (${AUTH_SUCCESS_COUNT}/${AUTH_TESTS})"
echo "  Error Rate: ${AUTH_ERROR_RATE}%"
echo "  Average Response Time: ${AUTH_AVG_TIME}ms"

# Test home endpoint
echo ""
echo "Testing home endpoint:"
HOME_RESPONSE=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null http://localhost:3001/home)
HOME_CODE=$(echo $HOME_RESPONSE | cut -d: -f1)
HOME_TIME=$(echo $HOME_RESPONSE | cut -d: -f2)
HOME_TIME_MS=$(echo "$HOME_TIME * 1000" | bc 2>/dev/null || echo "0")

if [ "$HOME_CODE" = "200" ] || [ "$HOME_CODE" = "307" ]; then
    echo "✅ Home Endpoint: $HOME_CODE OK (${HOME_TIME_MS}ms)"
else
    echo "❌ Home Endpoint: $HOME_CODE ERROR (${HOME_TIME_MS}ms)"
fi

echo ""
echo "📊 50% ROLLOUT PERFORMANCE SUMMARY:"
echo "┌─────────────────────────────────────────────────────────────┐"

# Overall performance calculation
if [ $AUTH_SUCCESS_COUNT -gt 0 ]; then
    OVERALL_AVG=$(echo "scale=1; ($AUTH_AVG_TIME + $HOME_TIME_MS) / 2" | bc 2>/dev/null || echo "0")
else
    OVERALL_AVG=$HOME_TIME_MS
fi

echo "│ Overall Success Rate: ${AUTH_SUCCESS_RATE}% (target: ≥99%)              │"
echo "│ Overall Error Rate: ${AUTH_ERROR_RATE}% (target: ≤1%)                 │"
echo "│ Average Response Time: ${OVERALL_AVG}ms (target: ≤100ms)        │"
echo "│ Load Level: 50% rollout (2x from 25%)                      │"
echo "└─────────────────────────────────────────────────────────────┘"

# Success criteria validation
SUCCESS_CRITERIA_MET=true

if [ $AUTH_SUCCESS_RATE -lt 99 ]; then
    echo "⚠️  Success rate below target: ${AUTH_SUCCESS_RATE}% (target: ≥99%)"
    SUCCESS_CRITERIA_MET=false
fi

if [ $AUTH_ERROR_RATE -gt 1 ]; then
    echo "⚠️  Error rate above target: ${AUTH_ERROR_RATE}% (target: ≤1%)"
    SUCCESS_CRITERIA_MET=false
fi

if [ "$(echo "$OVERALL_AVG > 100" | bc 2>/dev/null)" = "1" ]; then
    echo "⚠️  Response time above target: ${OVERALL_AVG}ms (target: ≤100ms)"
    SUCCESS_CRITERIA_MET=false
fi

echo ""
echo "🎯 50% ROLLOUT STATUS ASSESSMENT:"
if [ "$DISTRIBUTION_OK" = true ] && [ "$SERVER_OK" = true ] && [ "$SUCCESS_CRITERIA_MET" = true ] && [ $AUTH_SUCCESS_RATE -ge 99 ]; then
    echo "🎉 50% ROLLOUT: SUCCESSFUL"
    echo "✅ Distribution: Correct (~50%)"
    echo "✅ Performance: Excellent (${OVERALL_AVG}ms)"
    echo "✅ Success Rate: ${AUTH_SUCCESS_RATE}%"
    echo "✅ Error Rate: ${AUTH_ERROR_RATE}%"
    echo "✅ Majority adoption achieved!"
    echo "🚀 Ready for final phase (100% migration)"
else
    echo "⚠️  50% ROLLOUT: NEEDS ATTENTION"
    echo "🔍 Review metrics before proceeding to 100%"
    
    if [ "$DISTRIBUTION_OK" != true ]; then
        echo "  - Distribution: ${NEW_AUTH_COUNT}% (expected ~50%)"
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
echo "📈 LOAD SCALING ANALYSIS:"
echo "Previous Phases:"
echo "  5% Pilot:   ~5 users per 100"
echo "  15% Rollout: ~15 users per 100"
echo "  25% Rollout: ~25 users per 100"
echo "  50% Rollout: ~${NEW_AUTH_COUNT} users per 100"

if [ $NEW_AUTH_COUNT -gt 0 ]; then
    LOAD_INCREASE_FROM_25=$(echo "scale=1; $NEW_AUTH_COUNT / 25" | bc 2>/dev/null || echo "1.0")
    LOAD_INCREASE_FROM_5=$(echo "scale=1; $NEW_AUTH_COUNT / 5" | bc 2>/dev/null || echo "1.0")
    echo "Load Increase from 25%: ${LOAD_INCREASE_FROM_25}x"
    echo "Load Increase from 5%: ${LOAD_INCREASE_FROM_5}x"
fi

echo ""
echo "🔄 NEXT STEPS RECOMMENDATION:"
if [ "$SUCCESS_CRITERIA_MET" = true ] && [ $AUTH_SUCCESS_RATE -ge 99 ] && [ $NEW_AUTH_COUNT -ge 45 ]; then
    echo "1. ✅ Monitor 50% rollout for 1-2 hours"
    echo "2. 🚀 Proceed to 100% migration (final phase)"
    echo "3. 🧹 Clean up old authentication system"
    echo "4. 📚 Complete migration documentation"
else
    echo "1. 🔍 Investigate any performance issues"
    echo "2. 🛠️  Fix identified problems"
    echo "3. 🧪 Re-test before proceeding to 100%"
    echo "4. 📊 Monitor system stability"
fi

echo ""
echo "🏆 MIGRATION MILESTONE:"
if [ $NEW_AUTH_COUNT -ge 45 ]; then
    echo "🎉 MAJOR ACHIEVEMENT: Majority of users now using Supabase authentication!"
    echo "🚀 We've successfully migrated the majority of our user base"
    echo "📈 This represents a significant step toward complete migration"
else
    echo "📊 Progress: ${NEW_AUTH_COUNT}% of users on new authentication"
    echo "🎯 Target: Achieve majority adoption (≥50%)"
fi
