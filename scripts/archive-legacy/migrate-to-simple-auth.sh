#!/bin/bash

# MIGRATE TO SIMPLE AUTH CONTEXT
# This script replaces old auth-context imports with auth-context-simple

echo "🔄 Starting migration to simple auth context..."

# Backup current state
echo "📦 Creating backup..."
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# Replace imports in all files
echo "🔧 Replacing auth context imports..."
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  "s|from '@/contexts/auth-context'|from '@/contexts/auth-context-simple'|g" {} \;

# Special handling for type imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  "s|import { User } from '@/contexts/auth-context'|import { User } from '@supabase/supabase-js'|g" {} \;

echo "✅ Migration complete!"
echo "📝 Notes:"
echo "  - Old auth-context backed up to src.backup.*"
echo "  - All imports updated to use auth-context-simple"
echo "  - Some components may need manual adjustment for the simpler API"
