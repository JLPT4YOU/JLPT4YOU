#!/bin/bash

echo "🔍 Checking for button hover text contrast issues..."
echo "=================================================="

echo "📁 Looking for potential hover text problems..."

# Check for buttons with hover background but no text color change
echo "🔎 Buttons with hover:bg but no hover text color:"
find src -name "*.tsx" | xargs grep -n "hover:bg" | grep -v "hover:text\|hover-primary\|hover-secondary\|hover-muted\|hover-ghost\|hover-destructive" | head -10

echo ""
echo "🔎 Hardcoded hover colors (should use CSS variables):"
find src -name "*.tsx" | xargs grep -n "hover:bg-\[#\|hover:text-\[#" | head -5

echo ""
echo "🔎 Buttons with text color but no hover text adjustment:"
find src -name "*.tsx" | xargs grep -n "text-.*hover:bg\|hover:bg.*text-" | grep -v "hover:text\|hover-primary\|hover-secondary\|hover-muted\|hover-ghost" | head -5

echo ""
echo "✅ Checking complete!"
echo "💡 All results above should be reviewed for text contrast issues"
