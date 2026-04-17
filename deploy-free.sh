#!/bin/bash

echo "🚀 Deploying Traceless for FREE!"
echo "================================="

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx is required but not installed. Aborting."; exit 1; }

# Deploy frontend to Vercel
echo "📦 Step 1: Deploying frontend to Vercel..."
cd frontend || { echo "❌ Frontend directory not found"; exit 1; }

if ! npm install; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "🔗 Deploying to Vercel..."
VERCEL_OUTPUT=$(npx vercel --prod --yes 2>&1)
VERCEL_URL=$(echo "$VERCEL_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

if [ -z "$VERCEL_URL" ]; then
    echo "❌ Failed to get Vercel URL. Manual deployment may be needed."
    echo "Vercel output: $VERCEL_OUTPUT"
    exit 1
fi

echo "✅ Frontend deployed: $VERCEL_URL"

# Deploy backend to Railway
echo "🔧 Step 2: Deploying backend to Railway..."
cd ../backend || { echo "❌ Backend directory not found"; exit 1; }

# Check if Railway CLI is installed
if ! command -v railway >/dev/null 2>&1; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Logging into Railway..."
railway login --yes || { echo "❌ Railway login failed. Please login manually."; exit 1; }

echo "🚀 Initializing Railway project..."
railway init --yes --name "traceless-backend" || { echo "❌ Railway init failed"; exit 1; }

echo "📤 Deploying to Railway..."
railway up || { echo "❌ Railway deployment failed"; exit 1; }

# Get Railway URL (this might need manual checking)
echo "🔍 Getting Railway URL..."
RAILWAY_URL=$(railway domain 2>/dev/null | head -1)

if [ -z "$RAILWAY_URL" ]; then
    echo "⚠️  Could not automatically get Railway URL."
    echo "   Please check your Railway dashboard for the URL."
    RAILWAY_URL="https://your-railway-app.railway.app"
fi

# Set environment variables
echo "⚙️  Setting environment variables..."
railway variables set VW_FRONTEND_ORIGIN="$VERCEL_URL"
railway variables set VW_BROWSER_URL="http://localhost:3000"  # Update after Firefox deploy
railway variables set VW_DOWNLOAD_DIR="/tmp/downloads"
railway variables set VW_MAX_SESSION_MINUTES="30"
railway variables set VW_END_SESSION_STOPS_CONTAINER="true"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo "🌐 Frontend: $VERCEL_URL"
echo "🔗 Backend: $RAILWAY_URL"
echo ""
echo "📝 Next Steps:"
echo "1. Update VW_BROWSER_URL in Railway when you deploy Firefox container"
echo "2. Test your application at: $VERCEL_URL"
echo "3. Check Railway dashboard for backend logs"
echo ""
echo "💡 Free hosting limits:"
echo "   - Vercel: 100GB bandwidth/month"
echo "   - Railway: 512MB RAM, sleeps after inactivity"
echo ""
echo "🚀 Ready to deploy Firefox container? Check ALTERNATIVE_DEPLOYMENT.md"