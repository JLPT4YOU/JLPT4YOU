#!/bin/bash

echo "🔍 JLPT4YOU - Audit Legacy Authentication System"
echo "=================================================="
echo "Tìm kiếm các phần còn sử dụng hệ thống authentication cũ"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to search and count
search_pattern() {
    local pattern="$1"
    local description="$2"
    local files=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "$pattern" 2>/dev/null)
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

echo "🔍 1. LEGACY AUTHENTICATION PATTERNS"
echo "======================================"

# 1. Custom cookie management
search_pattern "document\.cookie.*jlpt4you_auth_token" "Custom auth cookie management"
search_pattern "jlpt4you_auth_token" "Legacy auth token references"

# 2. localStorage authentication
search_pattern "localStorage\.setItem.*AUTH_TOKEN" "localStorage auth token storage"
search_pattern "localStorage\.getItem.*AUTH_TOKEN" "localStorage auth token retrieval"

# 3. Demo credentials
search_pattern "DEMO_CREDENTIALS" "Demo credentials usage"
search_pattern "DEMO_USER" "Demo user data"
search_pattern "demo@jlpt4you\.com" "Demo email hardcoded"
search_pattern "demo1234" "Demo password hardcoded"

# 4. Manual session management
search_pattern "setAuthCookie" "Manual auth cookie setting"
search_pattern "clearAuthCookie" "Manual auth cookie clearing"

echo ""
echo "🔍 2. DEPRECATED AUTHENTICATION METHODS"
echo "======================================="

# 5. Old auth service patterns
search_pattern "checkAuthenticationSync" "Deprecated sync auth check"
search_pattern "isAuthenticatedSync" "Deprecated sync auth validation"

# 6. Legacy middleware patterns
search_pattern "shouldBypassAuthForTesting" "Testing auth bypass"
search_pattern "SKIP_AUTH_FOR_TESTING" "Auth bypass configuration"

echo ""
echo "🔍 3. INCONSISTENT SUPABASE USAGE"
echo "================================="

# 7. Mixed authentication approaches
search_pattern "createClient.*supabase-js" "Old Supabase client creation"
search_pattern "import.*createClient.*from.*@supabase/supabase-js" "Legacy Supabase import"

echo ""
echo "🔍 4. HARDCODED AUTHENTICATION STRINGS"
echo "======================================"

# 8. Hardcoded Vietnamese auth strings
search_pattern "Đăng nhập thành công" "Hardcoded Vietnamese auth messages"
search_pattern "Đăng ký thành công" "Hardcoded Vietnamese registration messages"
search_pattern "Mật khẩu không đúng" "Hardcoded Vietnamese error messages"

echo ""
echo "🔍 5. BACKUP AND STAGING FILES"
echo "=============================="

# 9. Check for backup files that might be used accidentally
echo -e "${YELLOW}📋 Checking for backup/staging files:${NC}"
find . -name "*backup*" -o -name "*staging*" | grep -E "\.(ts|tsx|js|jsx)$" | head -10

echo ""
echo "🔍 6. ENVIRONMENT VARIABLES"
echo "=========================="

# 10. Check for old environment variables
echo -e "${YELLOW}📋 Checking environment configuration:${NC}"
if [ -f ".env.local" ]; then
    echo "   📁 .env.local:"
    grep -E "(GEMINI_API_KEY|GROQ_API_KEY|AUTH_SECRET)" .env.local || echo "      No legacy auth env vars found"
fi

echo ""
echo "🔍 7. CONSTANTS AND CONFIGURATION"
echo "================================="

# 11. Check constants files
search_pattern "STORAGE_KEYS.*AUTH_TOKEN" "Legacy storage key constants"
search_pattern "jlpt4you_.*_token" "Legacy token naming patterns"

echo ""
echo "📊 SUMMARY"
echo "=========="
echo -e "${BLUE}Audit completed. Review all ${RED}❌ items${BLUE} above.${NC}"
echo -e "${BLUE}Each ${RED}❌ item${BLUE} represents code that should be migrated to Supabase.${NC}"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Review each flagged file"
echo "2. Replace legacy patterns with Supabase equivalents"
echo "3. Remove backup files if no longer needed"
echo "4. Update environment variables"
echo "5. Test authentication flow thoroughly"
echo ""
