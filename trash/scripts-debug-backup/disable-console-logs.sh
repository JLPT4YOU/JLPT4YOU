#!/bin/bash

echo "🔍 Tìm và disable tất cả console.log debug..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to search and count console logs
search_console_logs() {
    local pattern="$1"
    local description="$2"
    local files=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "$pattern" 2>/dev/null | grep -v "__tests__" | grep -v ".test." | grep -v "debug" | grep -v "trash")
    local count=$(echo "$files" | grep -v "^$" | wc -l)
    
    if [ $count -gt 0 ]; then
        echo -e "${RED}❌ $description${NC} (Found in $count files)"
        echo "$files" | while read file; do
            if [ ! -z "$file" ]; then
                echo "   📁 $file"
                grep -n "$pattern" "$file" | head -3 | sed 's/^/      /'
            fi
        done
        echo ""
    else
        echo -e "${GREEN}✅ $description${NC} (Clean)"
    fi
}

echo "🔍 1. CONSOLE.LOG PATTERNS"
echo "======================================"

# Search for various console patterns
search_console_logs "console\.log" "console.log statements"
search_console_logs "console\.warn" "console.warn statements"  
search_console_logs "console\.info" "console.info statements"
search_console_logs "console\.debug" "console.debug statements"

echo ""
echo "🔍 2. CONSOLE.ERROR PATTERNS (Should be conditional)"
echo "======================================"

search_console_logs "console\.error" "console.error statements"

echo ""
echo "🔍 3. SUPABASE DEBUG PATTERNS"
echo "======================================"

search_console_logs "debug.*true" "Supabase debug enabled"

echo ""
echo "✅ Console log scan complete!"
echo "💡 All console.log should be wrapped with process.env.NODE_ENV === 'development'"
