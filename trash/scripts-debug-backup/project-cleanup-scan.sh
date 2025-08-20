#!/bin/bash

# 🧹 JLPT4YOU PROJECT CLEANUP SCAN
# Quét toàn bộ dự án để tìm file rác, duplicate, và các vấn đề cần dọn dẹp

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 JLPT4YOU PROJECT CLEANUP SCAN${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Create logs directory
mkdir -p logs
LOG_FILE="logs/cleanup-scan-$(date +%Y%m%d-%H%M%S).log"

# Function to log and display
log_and_display() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# 1. BACKUP FILES SCAN
log_and_display "${YELLOW}📁 1. BACKUP FILES SCAN${NC}"
log_and_display "${YELLOW}======================${NC}"

backup_files=$(find . -name "*.backup" -o -name "*.bak" -o -name "*-backup-*" -o -name "*backup*" | grep -v node_modules | grep -v .git)
backup_count=$(echo "$backup_files" | grep -v "^$" | wc -l)

if [ $backup_count -gt 0 ]; then
    log_and_display "${RED}❌ Found $backup_count backup files:${NC}"
    echo "$backup_files" | while read file; do
        if [ ! -z "$file" ]; then
            size=$(du -h "$file" 2>/dev/null | cut -f1)
            log_and_display "   📄 $file ($size)"
        fi
    done
else
    log_and_display "${GREEN}✅ No backup files found${NC}"
fi
log_and_display ""

# 2. EMPTY/SMALL FILES SCAN
log_and_display "${YELLOW}📄 2. EMPTY/SMALL FILES SCAN${NC}"
log_and_display "${YELLOW}============================${NC}"

# Find empty files
empty_files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -empty)
empty_count=$(echo "$empty_files" | grep -v "^$" | wc -l)

if [ $empty_count -gt 0 ]; then
    log_and_display "${RED}❌ Found $empty_count empty files:${NC}"
    echo "$empty_files" | while read file; do
        if [ ! -z "$file" ]; then
            log_and_display "   📄 $file"
        fi
    done
else
    log_and_display "${GREEN}✅ No empty files found${NC}"
fi

# Find very small files (< 5 lines)
log_and_display ""
log_and_display "${CYAN}🔍 Files with less than 5 lines:${NC}"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" 2>/dev/null)
        if [ "$lines" -lt 5 ] && [ "$lines" -gt 0 ]; then
            log_and_display "   📄 $file ($lines lines)"
        fi
    fi
done
log_and_display ""

# 3. DUPLICATE FILES SCAN
log_and_display "${YELLOW}🔄 3. DUPLICATE FILES SCAN${NC}"
log_and_display "${YELLOW}==========================${NC}"

# Check for potential duplicate files by name pattern
log_and_display "${CYAN}🔍 Potential duplicate files by name:${NC}"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | sed 's/.*\///' | sort | uniq -d | while read filename; do
    if [ ! -z "$filename" ]; then
        log_and_display "   📄 Duplicate name: $filename"
        find src -name "$filename" | while read fullpath; do
            log_and_display "      📁 $fullpath"
        done
    fi
done
log_and_display ""

# 4. UNUSED IMPORTS SCAN
log_and_display "${YELLOW}📦 4. UNUSED IMPORTS SCAN${NC}"
log_and_display "${YELLOW}=========================${NC}"

# Look for files with many imports but little code
log_and_display "${CYAN}🔍 Files with potentially unused imports:${NC}"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
    if [ -f "$file" ]; then
        import_lines=$(grep -c "^import\|^export.*from" "$file" 2>/dev/null || echo 0)
        total_lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        
        if [ "$import_lines" -gt 5 ] && [ "$total_lines" -lt 50 ]; then
            log_and_display "   📄 $file ($import_lines imports, $total_lines total lines)"
        fi
    fi
done
log_and_display ""

# 5. TODO/FIXME COMMENTS SCAN
log_and_display "${YELLOW}📝 5. TODO/FIXME COMMENTS SCAN${NC}"
log_and_display "${YELLOW}==============================${NC}"

todo_count=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "TODO\|FIXME\|XXX\|HACK" {} \; | wc -l)
if [ $todo_count -gt 0 ]; then
    log_and_display "${YELLOW}⚠️ Found TODO/FIXME comments in $todo_count files:${NC}"
    find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "TODO\|FIXME\|XXX\|HACK" {} \; | head -10 | while read file; do
        log_and_display "   📄 $file"
        grep -n "TODO\|FIXME\|XXX\|HACK" "$file" | head -3 | sed 's/^/      /'
    done
else
    log_and_display "${GREEN}✅ No TODO/FIXME comments found${NC}"
fi
log_and_display ""

# 6. CONSOLE LOGS SCAN
log_and_display "${YELLOW}🖥️ 6. CONSOLE LOGS SCAN${NC}"
log_and_display "${YELLOW}=======================${NC}"

console_files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\." {} \; | grep -v __tests__ | grep -v __mocks__)
console_count=$(echo "$console_files" | grep -v "^$" | wc -l)

if [ $console_count -gt 0 ]; then
    log_and_display "${YELLOW}⚠️ Found console statements in $console_count files:${NC}"
    echo "$console_files" | head -10 | while read file; do
        if [ ! -z "$file" ]; then
            count=$(grep -c "console\." "$file" 2>/dev/null || echo 0)
            log_and_display "   📄 $file ($count console statements)"
        fi
    done
else
    log_and_display "${GREEN}✅ No console statements found${NC}"
fi
log_and_display ""

# 7. LARGE FILES SCAN
log_and_display "${YELLOW}📏 7. LARGE FILES SCAN${NC}"
log_and_display "${YELLOW}======================${NC}"

log_and_display "${CYAN}🔍 Files larger than 500 lines:${NC}"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        if [ "$lines" -gt 500 ]; then
            size=$(du -h "$file" 2>/dev/null | cut -f1)
            log_and_display "   📄 $file ($lines lines, $size)"
        fi
    fi
done
log_and_display ""

# 8. SUMMARY
log_and_display "${BLUE}📊 CLEANUP SUMMARY${NC}"
log_and_display "${BLUE}==================${NC}"

total_files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l)
log_and_display "📄 Total TypeScript files: $total_files"
log_and_display "🗂️ Backup files found: $backup_count"
log_and_display "📄 Empty files found: $empty_count"
log_and_display "📝 Files with TODO comments: $todo_count"
log_and_display "🖥️ Files with console logs: $console_count"
log_and_display ""
log_and_display "${GREEN}✅ Scan complete! Check log file: $LOG_FILE${NC}"
