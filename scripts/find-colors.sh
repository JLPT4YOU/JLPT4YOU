#!/bin/bash

echo "🔍 Scanning for remaining color usage in JLPT4YOU project..."
echo "=================================================="

# Color patterns to search for
PATTERNS=(
    "text-red"
    "text-blue" 
    "text-green"
    "text-yellow"
    "text-orange"
    "text-purple"
    "bg-red"
    "bg-blue"
    "bg-green" 
    "bg-yellow"
    "bg-orange"
    "bg-purple"
    "border-red"
    "border-blue"
    "border-green"
    "border-yellow"
    "border-orange"
    "border-purple"
)

# Search in source files
echo "📁 Searching in TypeScript/React files..."
for pattern in "${PATTERNS[@]}"; do
    echo "🔎 Searching for: $pattern"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "$pattern" | head -5
    echo ""
done

echo "📁 Searching for hex colors..."
find src -name "*.tsx" -o -name "*.ts" -o -name "*.css" | xargs grep -n "#[0-9A-Fa-f]\{6\}" | grep -v "currentColor" | head -10

echo ""
echo "✅ Color scan complete!"
echo "💡 All results above should be converted to monochrome variables"
