#!/bin/bash

# Complete Translation Hooks Rollback Script
# Khôi phục hoàn toàn từ backup về trạng thái ban đầu

echo "🔄 Starting complete rollback..."

# Khôi phục use-translations.ts đã có rồi

# Khôi phục tất cả files từ backup
echo "🔄 Khôi phục tất cả files từ backup..."

# Tìm backup mới nhất
LATEST_BACKUP=$(ls -t backup/ | grep "translation-hooks-migration" | head -1)
BACKUP_DIR="backup/$LATEST_BACKUP"

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ Không tìm thấy backup!"
    exit 1
fi

echo "📦 Sử dụng backup: $BACKUP_DIR"

# Khôi phục từng file
find "$BACKUP_DIR" -name "*.tsx" -o -name "*.ts" | while read backup_file; do
    # Lấy tên file
    filename=$(basename "$backup_file")
    # Tìm file tương ứng trong src
    src_file=$(find src -name "$filename" | head -1)

    if [ -n "$src_file" ]; then
        echo "🔄 Khôi phục: $filename"
        cp "$backup_file" "$src_file"
    fi
done

echo "✅ Rollback hoàn thành!"

# Kiểm tra kết quả
echo "📊 Kiểm tra kết quả..."
TOTAL_FILES=$(find src -name "*.tsx" -o -name "*.ts" | wc -l)
USE_LANGUAGE_CONTEXT_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useLanguageContext" | wc -l)
USE_TRANSLATIONS_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useTranslations" | wc -l)

echo "Tổng số files: $TOTAL_FILES"
echo "Files sử dụng useLanguageContext: $USE_LANGUAGE_CONTEXT_FILES"
echo "Files sử dụng useTranslations: $USE_TRANSLATIONS_FILES"

if [ "$USE_LANGUAGE_CONTEXT_FILES" -eq 0 ]; then
    echo "🎉 Rollback thành công! Tất cả files đã về trạng thái ban đầu."
else
    echo "⚠️  Vẫn còn $USE_LANGUAGE_CONTEXT_FILES files cần khôi phục thủ công."
fi
