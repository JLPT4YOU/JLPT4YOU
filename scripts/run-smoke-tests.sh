#!/bin/bash

# API Quality Check
# Validates code quality for refactored APIs

echo "🔍 Running API Quality Check..."
echo "================================"

# Set test environment
export NODE_ENV=test

# Run API lint validation
echo "📋 Validating API Code Quality..."
npx jest src/__tests__/api/api-lint-validation.test.ts --verbose --silent

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ API Quality Check passed!"
    echo "🚀 APIs meet production standards!"
else
    echo "❌ API Quality Check failed!"
    echo "🔧 Please fix the issues above before proceeding."
    exit 1
fi
