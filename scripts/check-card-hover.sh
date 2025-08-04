#!/bin/bash

echo "🔍 Checking Card hover effects usage..."
echo "======================================="

echo "📋 Finding all Card components:"
find src -name "*.tsx" | xargs grep -l "import.*Card\|from.*card" | grep -v demo | head -10

echo ""
echo "🔎 Cards that might need interactive prop:"
find src -name "*.tsx" | xargs grep -n "Card.*onClick\|onClick.*Card" | head -5

echo ""
echo "🔎 Cards with manual hover classes:"
find src -name "*.tsx" | xargs grep -n "Card.*hover\|hover.*Card" | grep -v demo | head -5

echo ""
echo "🔎 Cards with cursor-pointer (should be interactive):"
find src -name "*.tsx" | xargs grep -n "Card.*cursor-pointer\|cursor-pointer.*Card" | head -5

echo ""
echo "✅ Check complete!"
echo "💡 Cards with onClick or cursor-pointer should use interactive prop"
