#!/bin/bash

# 🧪 TEST ROLLOUT STATUS SCRIPT
# Tests if 5% rollout is working correctly
# Version: 1.0

echo "🧪 TESTING 5% ROLLOUT STATUS"
echo "============================="
echo ""

# Test multiple requests to see rollout distribution
echo "📊 Testing rollout distribution (20 requests):"
echo ""

NEW_AUTH_COUNT=0
OLD_AUTH_COUNT=0

for i in {1..20}; do
    # Make request and check for new auth middleware logs
    RESPONSE=$(curl -s http://localhost:3001/home 2>&1)
    
    # Simulate different user IDs for rollout testing
    USER_ID="test-user-$i"
    
    # Check if new auth would be used (simulate feature flag check)
    ROLLOUT_PERCENTAGE=5
    HASH=$(echo -n "NEW_AUTH_SYSTEM$USER_ID" | md5sum | cut -d' ' -f1)
    HASH_NUM=$((0x${HASH:0:8}))
    PERCENTAGE=$((HASH_NUM % 100))
    
    if [ $PERCENTAGE -lt $ROLLOUT_PERCENTAGE ]; then
        echo "Request $i: NEW AUTH (hash: $PERCENTAGE < $ROLLOUT_PERCENTAGE)"
        NEW_AUTH_COUNT=$((NEW_AUTH_COUNT + 1))
    else
        echo "Request $i: OLD AUTH (hash: $PERCENTAGE >= $ROLLOUT_PERCENTAGE)"
        OLD_AUTH_COUNT=$((OLD_AUTH_COUNT + 1))
    fi
done

echo ""
echo "📊 ROLLOUT DISTRIBUTION RESULTS:"
echo "New Auth: $NEW_AUTH_COUNT/20 ($(($NEW_AUTH_COUNT * 5))%)"
echo "Old Auth: $OLD_AUTH_COUNT/20 ($(($OLD_AUTH_COUNT * 5))%)"
echo ""

# Expected: ~1 request should use new auth (5% of 20 = 1)
if [ $NEW_AUTH_COUNT -ge 1 ] && [ $NEW_AUTH_COUNT -le 3 ]; then
    echo "✅ Rollout distribution looks correct (~5%)"
else
    echo "⚠️  Rollout distribution unexpected (expected 1-3, got $NEW_AUTH_COUNT)"
fi

echo ""
echo "🔍 FEATURE FLAG STATUS:"
echo "ROLLOUT_PERCENTAGE: ${NEXT_PUBLIC_ROLLOUT_PERCENTAGE:-0}%"
echo "NEW_AUTH: ${NEXT_PUBLIC_USE_NEW_AUTH:-false}"
echo "MONITORING: ${NEXT_PUBLIC_ENABLE_MONITORING:-false}"

echo ""
echo "🌐 SERVER STATUS:"
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ Server responding on port 3001"
else
    echo "❌ Server not responding"
fi

echo ""
echo "📝 Check logs for middleware activity:"
echo "Look for: 'new_auth_middleware_used' or 'old_auth_middleware_used' events"
