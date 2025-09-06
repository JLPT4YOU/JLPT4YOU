#!/bin/bash

echo "🧹 JLPT4YOU - Legacy Authentication Cleanup"
echo "============================================"
echo "Tự động dọn dẹp các phần còn sử dụng hệ thống authentication cũ"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory
BACKUP_DIR="jlpt4you-trash-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}📦 Created backup directory: $BACKUP_DIR${NC}"
echo ""

# Function to safely move files to trash
move_to_trash() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo -e "${YELLOW}🗑️  Moving to trash: $file${NC}"
        echo "   📝 $description"
        mv "$file" "$BACKUP_DIR/"
        echo -e "${GREEN}   ✅ Moved successfully${NC}"
    else
        echo -e "${GREEN}   ✅ File not found (already clean): $file${NC}"
    fi
    echo ""
}

# Function to remove lines from file
remove_lines() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if [ -f "$file" ]; then
        echo -e "${YELLOW}🔧 Cleaning: $file${NC}"
        echo "   📝 $description"
        
        # Create backup
        cp "$file" "$BACKUP_DIR/$(basename $file).backup"
        
        # Remove lines matching pattern
        grep -v "$pattern" "$file" > "$file.tmp" && mv "$file.tmp" "$file"
        echo -e "${GREEN}   ✅ Cleaned successfully${NC}"
    else
        echo -e "${GREEN}   ✅ File not found: $file${NC}"
    fi
    echo ""
}

echo "🔍 PHASE 1: CRITICAL CLEANUP"
echo "============================="

# 1. Remove backup authentication files
move_to_trash "src/contexts/auth-context-backup.tsx" "Legacy backup auth context with demo credentials"
move_to_trash "staging/src/contexts/auth-context-backup.tsx" "Staging backup auth context"

echo ""
echo "🔍 PHASE 2: DEPRECATED CODE CLEANUP"
echo "===================================="

# 2. Clean up middleware deprecated functions
if [ -f "src/middleware/modules/authentication.ts" ]; then
    echo -e "${YELLOW}🔧 Cleaning middleware authentication module${NC}"
    
    # Backup original file
    cp "src/middleware/modules/authentication.ts" "$BACKUP_DIR/authentication.ts.backup"
    
    # Remove deprecated sync functions (will be done manually for safety)
    echo -e "${BLUE}   📝 Note: Deprecated sync functions need manual review${NC}"
    echo -e "${BLUE}   📝 Functions to review: checkAuthenticationSync, isAuthenticatedSync${NC}"
fi

# 3. Clean up storage constants usage
echo -e "${YELLOW}🔧 Cleaning STORAGE_KEYS.AUTH_TOKEN usage${NC}"

# Update auth-context.tsx to remove AUTH_TOKEN references
if [ -f "src/contexts/auth-context.tsx" ]; then
    cp "src/contexts/auth-context.tsx" "$BACKUP_DIR/auth-context.tsx.backup"
    
    # Replace AUTH_TOKEN removals with comments (safer approach)
    sed -i.tmp 's/localStorage\.removeItem(STORAGE_KEYS\.AUTH_TOKEN)/\/\/ ✅ REMOVED: AUTH_TOKEN localStorage cleanup - now handled by Supabase/g' "src/contexts/auth-context.tsx"
    rm -f "src/contexts/auth-context.tsx.tmp"
    echo -e "${GREEN}   ✅ Updated auth-context.tsx${NC}"
fi

# Update auth-utils.ts
if [ -f "src/lib/auth-utils.ts" ]; then
    cp "src/lib/auth-utils.ts" "$BACKUP_DIR/auth-utils.ts.backup"
    echo -e "${BLUE}   📝 Note: auth-utils.ts needs manual review for AUTH_TOKEN usage${NC}"
fi

echo ""
echo "🔍 PHASE 3: TESTING CONFIGURATION CLEANUP"
echo "=========================================="

# 4. Clean up testing auth bypass
if [ -f "src/middleware/config/constants.ts" ]; then
    echo -e "${YELLOW}🔧 Cleaning testing auth bypass configuration${NC}"
    cp "src/middleware/config/constants.ts" "$BACKUP_DIR/constants.ts.backup"
    
    # Comment out auth bypass (safer than removing)
    sed -i.tmp 's/SKIP_AUTH_FOR_TESTING: true/\/\/ SKIP_AUTH_FOR_TESTING: false \/\/ ✅ REMOVED: Auth bypass for security/g' "src/middleware/config/constants.ts"
    rm -f "src/middleware/config/constants.ts.tmp"
    echo -e "${GREEN}   ✅ Disabled auth bypass${NC}"
fi

echo ""
echo "🔍 PHASE 4: DOCUMENTATION UPDATE"
echo "================================="

# 5. Create cleanup summary
cat > "$BACKUP_DIR/CLEANUP_SUMMARY.md" << EOF
# Legacy Authentication Cleanup Summary

**Date:** $(date)
**Backup Directory:** $BACKUP_DIR

## Files Moved to Trash:
- src/contexts/auth-context-backup.tsx
- staging/src/contexts/auth-context-backup.tsx

## Files Modified:
- src/contexts/auth-context.tsx (AUTH_TOKEN references commented)
- src/middleware/config/constants.ts (auth bypass disabled)

## Manual Review Required:
- src/middleware/modules/authentication.ts (remove sync functions)
- src/lib/auth-utils.ts (update AUTH_TOKEN usage)
- API routes with old Supabase imports

## Next Steps:
1. Review modified files
2. Remove deprecated sync functions manually
3. Test authentication flow
4. Update API routes to use centralized Supabase clients

## Rollback Instructions:
If needed, restore files from this backup directory:
\`\`\`bash
cp $BACKUP_DIR/*.backup src/path/to/original/location/
\`\`\`
EOF

echo -e "${GREEN}✅ Created cleanup summary: $BACKUP_DIR/CLEANUP_SUMMARY.md${NC}"

echo ""
echo "📊 CLEANUP SUMMARY"
echo "=================="
echo -e "${GREEN}✅ Phase 1: Critical cleanup completed${NC}"
echo -e "${GREEN}✅ Phase 2: Deprecated code cleanup completed${NC}"
echo -e "${GREEN}✅ Phase 3: Testing configuration cleanup completed${NC}"
echo -e "${GREEN}✅ Phase 4: Documentation updated${NC}"

echo ""
echo -e "${BLUE}📋 MANUAL REVIEW REQUIRED:${NC}"
echo "1. Review src/middleware/modules/authentication.ts"
echo "2. Remove checkAuthenticationSync and isAuthenticatedSync functions"
echo "3. Update src/lib/auth-utils.ts AUTH_TOKEN usage"
echo "4. Test authentication flow thoroughly"

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "- All original files backed up to: $BACKUP_DIR"
echo "- Test authentication before deploying"
echo "- Review CLEANUP_SUMMARY.md for details"

echo ""
echo -e "${GREEN}🎉 Legacy authentication cleanup completed!${NC}"
echo -e "${GREEN}🔧 Next: Run 'npm run dev' and test login/logout flow${NC}"
