#!/bin/bash

# Translation Hooks Migration Script
# Migrates from useTranslations to useLanguageContext

echo "🚀 Starting translation hooks migration..."

# Create backup directory with timestamp
BACKUP_DIR="backup/translation-hooks-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in $BACKUP_DIR..."

# Find all files using useTranslations and backup them
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useTranslations" | while read file; do
    cp "$file" "$BACKUP_DIR/"
done

echo "🔄 Migrating files..."

# Replace useTranslations imports with useLanguageContext
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useTranslations" | while read file; do
    echo "Processing: $file"
    
    # Replace import statement
    sed -i '' 's/import { useTranslations } from '\''@\/hooks\/use-translations'\''/import { useLanguageContext } from '\''@\/contexts\/language-context'\''/g' "$file"
    
    # Replace hook usage
    sed -i '' 's/const { t } = useTranslations()/const { t } = useLanguageContext()/g' "$file"
    sed -i '' 's/const { t, /const { t, /g' "$file"
    sed -i '' 's/useTranslations()/useLanguageContext()/g' "$file"
done

echo "✅ Migration completed!"
echo "📊 Checking remaining useTranslations usage..."

REMAINING=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useTranslations" | wc -l)
echo "Remaining files with useTranslations: $REMAINING"

if [ "$REMAINING" -eq 0 ]; then
    echo "🎉 All files successfully migrated!"
    echo "💡 You can now safely remove src/hooks/use-translations.ts"
else
    echo "⚠️  Some files still need manual migration"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useTranslations"
fi

echo "🔍 Backup created at: $BACKUP_DIR"
