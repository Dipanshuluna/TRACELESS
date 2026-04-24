#!/bin/bash

# Render Deployment Helper Script
# Run this locally to test your deployment setup

echo "🚀 Testing Traceless Deployment Setup"
echo "====================================="

# Test backend
echo "📦 Testing backend..."
cd backend
python3 -c "import flask, docker, flask_cors; print('✅ Backend dependencies OK')"
cd ..

# Test frontend build
echo "🎨 Testing frontend build..."
cd frontend
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
if [ -d "dist" ]; then
    echo "✅ Frontend build OK"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Check Docker setup
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker available"
else
    echo "⚠️  Docker not available (expected on Render)"
fi

echo ""
echo "🎉 Pre-deployment checks complete!"
echo ""
echo "Next steps:"
echo "1. Push this code to GitHub"
echo "2. Connect your repo to Render"
echo "3. Create a new Blueprint from render.yaml"
echo "4. Update service URLs in environment variables"
echo ""
echo "📖 See RENDER_DEPLOYMENT.md for detailed instructions"