#!/bin/bash

# Translation Hooks Migration Rollback Script
# Khôi phục từ backup về trạng thái ban đầu

echo "🔄 Starting rollback process..."

# Tìm backup mới nhất
LATEST_BACKUP=$(ls -t backup/ | grep "translation-hooks-migration" | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ Không tìm thấy backup file!"
    exit 1
fi

BACKUP_DIR="backup/$LATEST_BACKUP"
echo "📦 Sử dụng backup: $BACKUP_DIR"

# Khôi phục use-translations.ts
if [ -f "$BACKUP_DIR/use-translations.ts" ]; then
    echo "🔄 Khôi phục use-translations.ts..."
    cp "$BACKUP_DIR/use-translations.ts" src/hooks/use-translations.ts
    echo "✅ Đã khôi phục use-translations.ts"
else
    echo "⚠️  Không tìm thấy use-translations.ts trong backup"
fi

# Khôi phục các files đã bị thay đổi
echo "🔄 Khôi phục các files đã migrate..."

# Tìm tất cả files trong backup và khôi phục
find "$BACKUP_DIR" -name "*.tsx" -o -name "*.ts" | while read backup_file; do
    # Lấy path tương đối
    relative_path=$(echo "$backup_file" | sed "s|$BACKUP_DIR/||")
    src_file="src/$relative_path"

    if [ -f "$src_file" ]; then
        echo "🔄 Khôi phục: $relative_path"
        cp "$backup_file" "$src_file"
    else
        echo "⚠️  File không tồn tại trong src: $relative_path"
    fi
done

echo "✅ Rollback hoàn thành!"
echo "📊 Kiểm tra kết quả..."

# Kiểm tra xem đã khôi phục thành công chưa
REMAINING=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useLanguageContext" | wc -l)
echo "Files còn sử dụng useLanguageContext: $REMAINING"

USE_TRANSLATIONS_COUNT=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useTranslations" | wc -l)
echo "Files sử dụng useTranslations: $USE_TRANSLATIONS_COUNT"

if [ "$REMAINING" -eq 0 ] && [ "$USE_TRANSLATIONS_COUNT" -gt 0 ]; then
    echo "🎉 Rollback thành công!"
else
    echo "⚠️  Cần kiểm tra lại..."
fi

echo "🔍 Backup được sử dụng: $BACKUP_DIR"
