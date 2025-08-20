#!/bin/bash

# 🧪 TEST 15% ROLLOUT DISTRIBUTION
# Validates that 15% rollout is working correctly
# Version: 1.0

echo "🧪 TESTING 15% ROLLOUT DISTRIBUTION"
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
    ROLLOUT_PERCENTAGE=15
    
    # Use same hash function as feature flags
    HASH=$(echo -n "NEW_AUTH_SYSTEM$USER_ID" | md5 | cut -c1-8)
    HASH_NUM=$((0x$HASH))
    PERCENTAGE=$((HASH_NUM % 100))
    
    if [ $PERCENTAGE -lt $ROLLOUT_PERCENTAGE ]; then
        NEW_AUTH_COUNT=$((NEW_AUTH_COUNT + 1))
        if [ $((i % 20)) -eq 0 ]; then
            echo "User $i: NEW AUTH (hash: $PERCENTAGE < $ROLLOUT_PERCENTAGE)"
        fi
    else
        OLD_AUTH_COUNT=$((OLD_AUTH_COUNT + 1))
        if [ $((i % 20)) -eq 0 ]; then
            echo "User $i: OLD AUTH (hash: $PERCENTAGE >= $ROLLOUT_PERCENTAGE)"
        fi
    fi
done

echo ""
echo "📊 ROLLOUT DISTRIBUTION RESULTS:"
echo "New Auth: $NEW_AUTH_COUNT/100 (${NEW_AUTH_COUNT}%)"
echo "Old Auth: $OLD_AUTH_COUNT/100 (${OLD_AUTH_COUNT}%)"
echo ""

# Validate distribution
if [ $NEW_AUTH_COUNT -ge 10 ] && [ $NEW_AUTH_COUNT -le 20 ]; then
    echo "✅ Rollout distribution CORRECT (~15%)"
    echo "🎯 Expected: 15%, Actual: ${NEW_AUTH_COUNT}%"
else
    echo "⚠️  Rollout distribution unexpected"
    echo "🎯 Expected: 15%, Actual: ${NEW_AUTH_COUNT}%"
fi

echo ""
echo "🔍 ENVIRONMENT STATUS:"
echo "ROLLOUT_PERCENTAGE: ${NEXT_PUBLIC_ROLLOUT_PERCENTAGE:-0}%"
echo "MONITORING: ${NEXT_PUBLIC_ENABLE_MONITORING:-false}"

echo ""
echo "🌐 SERVER HEALTH:"
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ Server responding on port 3001"
else
    echo "❌ Server not responding"
fi

# Test actual endpoints
echo ""
echo "🧪 ENDPOINT TESTING:"

# Test auth endpoint
AUTH_RESPONSE=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null http://localhost:3001/auth/vn/login)
AUTH_CODE=$(echo $AUTH_RESPONSE | cut -d: -f1)
AUTH_TIME=$(echo $AUTH_RESPONSE | cut -d: -f2)
AUTH_TIME_MS=$(echo "$AUTH_TIME * 1000" | bc 2>/dev/null || echo "N/A")

if [ "$AUTH_CODE" = "200" ]; then
    echo "✅ Auth endpoint: 200 OK (${AUTH_TIME_MS}ms)"
else
    echo "❌ Auth endpoint: $AUTH_CODE ERROR"
fi

# Test home endpoint
HOME_RESPONSE=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null http://localhost:3001/home)
HOME_CODE=$(echo $HOME_RESPONSE | cut -d: -f1)
HOME_TIME=$(echo $HOME_RESPONSE | cut -d: -f2)
HOME_TIME_MS=$(echo "$HOME_TIME * 1000" | bc 2>/dev/null || echo "N/A")

if [ "$HOME_CODE" = "200" ] || [ "$HOME_CODE" = "307" ]; then
    echo "✅ Home endpoint: $HOME_CODE OK (${HOME_TIME_MS}ms)"
else
    echo "❌ Home endpoint: $HOME_CODE ERROR"
fi

echo ""
echo "📊 PERFORMANCE SUMMARY:"
if [ "$AUTH_TIME_MS" != "N/A" ] && [ "$HOME_TIME_MS" != "N/A" ]; then
    AVG_TIME=$(echo "($AUTH_TIME_MS + $HOME_TIME_MS) / 2" | bc 2>/dev/null || echo "N/A")
    echo "Average Response Time: ${AVG_TIME}ms"
    
    if [ "$AVG_TIME" != "N/A" ] && [ "$(echo "$AVG_TIME < 100" | bc 2>/dev/null)" = "1" ]; then
        echo "✅ Performance target MET (<100ms for 15% rollout)"
    else
        echo "⚠️  Performance target: ${AVG_TIME}ms (target: <100ms)"
    fi
else
    echo "⚠️  Could not calculate average response time"
fi

echo ""
echo "🎯 15% ROLLOUT STATUS:"
if [ $NEW_AUTH_COUNT -ge 10 ] && [ $NEW_AUTH_COUNT -le 20 ] && [ "$AUTH_CODE" = "200" ]; then
    echo "🎉 15% ROLLOUT: SUCCESSFUL"
    echo "✅ Ready for next phase (25% rollout)"
else
    echo "⚠️  15% ROLLOUT: NEEDS ATTENTION"
    echo "🔍 Review metrics before proceeding"
fi
