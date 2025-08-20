#!/bin/bash

# 🔧 WRAP CONSOLE LOGS FOR PRODUCTION
# Tự động wrap console logs với development check để tránh xuất hiện trong production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 WRAP CONSOLE LOGS FOR PRODUCTION${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Create backup directory
BACKUP_DIR="trash/console-logs-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${CYAN}📁 Created backup directory: $BACKUP_DIR${NC}"
echo ""

# Function to process a file
process_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    local modified=false

    # Create backup with full path structure
    backup_file="$BACKUP_DIR/${file#src/}"
    mkdir -p "$(dirname "$backup_file")"
    cp "$file" "$backup_file"

    # Process the file
    while IFS= read -r line; do
        # Check if line contains console statements
        if [[ "$line" =~ console\.(log|error|warn|info|debug|trace) ]]; then
            # Skip if already wrapped or in comments
            if [[ "$line" =~ "process.env.NODE_ENV" ]] || [[ "$line" =~ ^[[:space:]]*// ]] || [[ "$line" =~ ^[[:space:]]*\* ]]; then
                echo "$line" >> "$temp_file"
            else
                # Get indentation
                indent=$(echo "$line" | sed 's/[^ ].*//')

                # Extract the console statement (preserve original formatting)
                console_statement=$(echo "$line" | sed 's/^[[:space:]]*//')

                # Only wrap debug/log statements, keep errors/warnings always visible
                if [[ "$line" =~ console\.(error|warn) ]]; then
                    # Keep errors and warnings always visible
                    echo "$line" >> "$temp_file"
                else
                    # Wrap debug/log/info statements
                    echo "${indent}if (process.env.NODE_ENV === 'development') {" >> "$temp_file"
                    echo "${indent}  $console_statement" >> "$temp_file"
                    echo "${indent}}" >> "$temp_file"
                    modified=true
                fi
            fi
        else
            echo "$line" >> "$temp_file"
        fi
    done < "$file"

    # Replace original file if modified
    if [ "$modified" = true ]; then
        mv "$temp_file" "$file"
        echo -e "   ✅ Modified: $file"
        return 0
    else
        rm -f "$temp_file"
        return 1
    fi
}

# Find files with console statements (excluding tests and mocks)
echo -e "${YELLOW}🔍 Finding files with console statements...${NC}"
files_with_console=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "src/__tests__/*" \
    -not -path "src/__mocks__/*" \
    -exec grep -l "console\." {} \;)

total_files=$(echo "$files_with_console" | grep -v "^$" | wc -l)
echo -e "${CYAN}📄 Found $total_files files with console statements${NC}"
echo ""

if [ $total_files -eq 0 ]; then
    echo -e "${GREEN}✅ No console statements found to wrap!${NC}"
    exit 0
fi

# Process files
echo -e "${YELLOW}🔧 Processing files...${NC}"
modified_count=0

echo "$files_with_console" | while read file; do
    if [ ! -z "$file" ] && [ -f "$file" ]; then
        if process_file "$file"; then
            ((modified_count++))
        fi
    fi
done

# Count actual modifications (since we're in a subshell, need to recount)
modified_count=0
echo "$files_with_console" | while read file; do
    if [ ! -z "$file" ] && [ -f "$file" ]; then
        # Check if file was actually modified by looking for our pattern
        if grep -q "process.env.NODE_ENV === 'development'" "$file"; then
            ((modified_count++))
        fi
    fi
done

echo ""
echo -e "${GREEN}📊 WRAP CONSOLE LOGS SUMMARY${NC}"
echo -e "${GREEN}=============================${NC}"
echo -e "📄 Files scanned: $total_files"
echo -e "🔧 Files modified: $modified_count"
echo -e "📁 Backup directory: $BACKUP_DIR"
echo ""

# Show example of what was done
echo -e "${CYAN}💡 Example transformation:${NC}"
echo -e "${YELLOW}Before:${NC}"
echo -e "  console.log('Debug message')"
echo ""
echo -e "${YELLOW}After:${NC}"
echo -e "  if (process.env.NODE_ENV === 'development') {"
echo -e "    console.log('Debug message')"
echo -e "  }"
echo ""

# Verify no syntax errors
echo -e "${YELLOW}🔍 Checking for syntax errors...${NC}"
if npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ No TypeScript errors found${NC}"
else
    echo -e "${RED}❌ TypeScript errors detected. Check the output:${NC}"
    npm run type-check
    echo ""
    echo -e "${YELLOW}💡 To restore files: cp $BACKUP_DIR/* src/path/to/files/${NC}"
fi

echo ""
echo -e "${GREEN}✅ Console logs wrapping completed!${NC}"
echo -e "${CYAN}💡 Console logs will now only appear in development mode${NC}"
echo -e "${CYAN}💡 Production builds will be cleaner and more performant${NC}"
