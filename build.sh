#!/bin/bash

echo "🚀 Building AI Toolkit CLI..."

# Clean previous builds
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# Run TypeScript compilation
echo "🔧 Compiling TypeScript..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📁 Generated files:"
    find dist/ -type f | sort
    echo ""
    echo "🧪 Running tests..."
    npm test -- --passWithNoTests
    echo ""
    echo "🎉 Ready to use! Install with: npm link"
else
    echo "❌ Build failed!"
    exit 1
fi