#!/bin/bash

# Remove legacy translation files
echo "🗑️  Moving legacy files to trash..."

# Create trash directory
mkdir -p trash/legacy-removed-$(date +%Y%m%d-%H%M%S)
TRASH_DIR="trash/legacy-removed-$(date +%Y%m%d-%H%M%S)"

# Move legacy files
mv src/translations/vn.json "$TRASH_DIR/" 2>/dev/null || echo "vn.json not found"
mv src/translations/en.json "$TRASH_DIR/" 2>/dev/null || echo "en.json not found"
mv src/translations/jp.json "$TRASH_DIR/" 2>/dev/null || echo "jp.json not found"

# Remove fallback from compatibility layer
echo "🔧 Removing fallback from compatibility layer..."
sed -i.bak '/Fallback to original loadTranslation/,/return await loadTranslation(language)/d' src/lib/translation-compatibility.ts

echo "✅ Legacy files removed successfully!"
echo "📊 Files moved to: $TRASH_DIR"
echo ""
echo "🎯 MIGRATION COMPLETE!"
echo "   ✅ Module system is now the only translation system"
echo "   ✅ Legacy files removed"
echo "   ✅ Fallback removed"
echo ""
echo "🧪 Test the application to ensure everything works correctly."
