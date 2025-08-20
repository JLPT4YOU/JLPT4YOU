#!/bin/bash

# 🧪 TEST CONSOLE WRAP SCRIPT
# Test script trên một vài files trước khi chạy toàn bộ

echo "🧪 Testing console wrap on a few files..."

# Find files with most console statements
echo "📊 Top 5 files with most console statements:"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "src/__tests__/*" \
    -not -path "src/__mocks__/*" \
    -exec grep -c "console\." {} + \
    | sort -t: -k2 -nr \
    | head -5 \
    | while IFS=: read file count; do
        echo "   📄 $file ($count console statements)"
    done

echo ""
echo "🔍 Let's examine one file before processing..."

# Pick a file with moderate console usage
test_file=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "src/__tests__/*" \
    -not -path "src/__mocks__/*" \
    -exec grep -l "console\." {} \; | head -1)

if [ ! -z "$test_file" ]; then
    echo "📄 Examining: $test_file"
    echo ""
    echo "🔍 Console statements found:"
    grep -n "console\." "$test_file" | head -3
    echo ""
    echo "✅ Ready to run full script? (y/n)"
else
    echo "❌ No suitable test file found"
fi
