#!/bin/bash

# Force Complete Rollback Script
# Khôi phục hoàn toàn tất cả thay đổi về useTranslations

echo "🔄 Force rollback tất cả files..."

# Thay thế tất cả useLanguageContext import thành useTranslations
echo "🔄 Thay thế imports..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { useLanguageContext } from '\''@\/contexts\/language-context'\''|import { useTranslations } from '\''@\/hooks\/use-translations'\''|g'

# Thay thế tất cả hook usage
echo "🔄 Thay thế hook usage..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/const { t } = useLanguageContext()/const { t } = useTranslations()/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/const { t, /const { t, /g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/useLanguageContext()/useTranslations()/g'

echo "✅ Force rollback hoàn thành!"

# Kiểm tra kết quả
echo "📊 Kiểm tra kết quả..."
USE_LANGUAGE_CONTEXT_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useLanguageContext" | wc -l)
USE_TRANSLATIONS_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useTranslations" | wc -l)

echo "Files còn sử dụng useLanguageContext: $USE_LANGUAGE_CONTEXT_FILES"
echo "Files sử dụng useTranslations: $USE_TRANSLATIONS_FILES"

if [ "$USE_LANGUAGE_CONTEXT_FILES" -eq 0 ]; then
    echo "🎉 Force rollback thành công!"
else
    echo "⚠️  Vẫn còn files cần xử lý thủ công"
fi
