#!/bin/bash

# Bundle Analysis Script for JLPT4YOU
# This script analyzes the Next.js bundle size and opens the report in browser

echo "🔍 Starting Bundle Analysis..."
echo "================================"

# Check if @next/bundle-analyzer is installed
if ! npm ls @next/bundle-analyzer &>/dev/null; then
    echo "📦 Installing @next/bundle-analyzer..."
    npm install --save-dev @next/bundle-analyzer
fi

# Run the analysis
echo "📊 Building with bundle analyzer..."
ANALYZE=true npm run build

echo ""
echo "✅ Bundle analysis complete!"
echo "The analyzer report should open automatically in your browser."
echo "Look for large dependencies that could be:"
echo "  - Lazy loaded"
echo "  - Replaced with lighter alternatives"
echo "  - Tree-shaken more effectively"
