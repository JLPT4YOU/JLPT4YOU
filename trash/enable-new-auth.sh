#!/bin/bash

# Script to enable new authentication system
echo "🔄 Enabling new authentication system..."

# Backup current .env.local
cp .env.local .env.local.backup-$(date +%Y%m%d-%H%M%S)

# Update authentication flags
sed -i '' 's/NEXT_PUBLIC_USE_NEW_AUTH=false/NEXT_PUBLIC_USE_NEW_AUTH=true/' .env.local
sed -i '' 's/NEXT_PUBLIC_USE_NEW_API_AUTH=false/NEXT_PUBLIC_USE_NEW_API_AUTH=true/' .env.local
sed -i '' 's/NEXT_PUBLIC_USE_NEW_AUTH_CONTEXT=false/NEXT_PUBLIC_USE_NEW_AUTH_CONTEXT=true/' .env.local

echo "✅ Authentication flags updated:"
grep "USE_NEW_AUTH" .env.local

echo ""
echo "⚠️  IMPORTANT: Please restart your Next.js server for changes to take effect!"
echo "    Run: npm run dev"
