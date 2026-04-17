# FREE Deployment Options for Traceless

## 🎉 **Completely FREE Hosting Solutions**

### Option 1: Vercel + Railway (Recommended Free Combo)
**Cost**: $0/month | **Best for**: Full-featured deployment

#### Frontend on Vercel (FREE)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy frontend
cd frontend
vercel --prod

# 3. Set environment variable
VITE_API_BASE_URL=https://your-railway-app.railway.app/api
```

#### Backend on Railway (FREE)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up

# 3. Set environment variables
VW_FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
VW_BROWSER_URL=https://your-fly-app.fly.dev
VW_DOWNLOAD_DIR=/tmp/downloads
```

### Option 2: Netlify + Fly.io (Alternative Free Combo)
**Cost**: $0/month | **Best for**: Static frontend + containerized backend

#### Frontend on Netlify (FREE)
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Deploy frontend
cd frontend
netlify deploy --prod --dir=dist
```

#### Backend on Fly.io (FREE)
```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Initialize and deploy
fly launch
fly deploy

# 3. Set environment variables
fly secrets set VW_FRONTEND_ORIGIN=https://your-netlify-app.netlify.app
fly secrets set VW_BROWSER_URL=https://your-firefox-app.fly.dev
```

### Option 3: GitHub Pages + Railway (Ultra Simple)
**Cost**: $0/month | **Best for**: Quick testing

#### Frontend on GitHub Pages (FREE)
```bash
# 1. Enable GitHub Pages in repository settings
# 2. Build and deploy automatically via GitHub Actions

# Create .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: |
          cd frontend
          npm install
          npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

#### Backend on Railway (FREE)
Same as Option 1 above.

## 🆓 **Free Tier Limits & Considerations**

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ 100GB hours/month
- ✅ Custom domains
- ✅ Automatic HTTPS
- ❌ No serverless functions for backend

### Railway Free Tier
- ✅ 512MB RAM
- ✅ 1GB disk
- ✅ 24/7 uptime
- ✅ PostgreSQL database
- ❌ Limited CPU

### Fly.io Free Tier
- ✅ 256MB RAM
- ✅ 1GB disk
- ✅ Global deployment
- ✅ Custom domains
- ❌ Limited bandwidth

### Netlify Free Tier
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Custom domains
- ✅ Forms & functions
- ❌ No backend hosting

## 🚀 **Quick Free Deployment Script**

Create `deploy-free.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying Traceless for FREE!"

# Deploy frontend to Vercel
echo "📦 Deploying frontend to Vercel..."
cd frontend
npm install
npx vercel --prod --yes

# Get Vercel URL
VERCEL_URL=$(npx vercel --yes | grep "https://" | tail -1)

# Deploy backend to Railway
echo "🔧 Deploying backend to Railway..."
cd ../backend
railway login --yes
railway init --yes
railway up

# Set environment variables
railway variables set VW_FRONTEND_ORIGIN=$VERCEL_URL
railway variables set VW_BROWSER_URL=http://localhost:3000  # Update after Firefox deploy
railway variables set VW_DOWNLOAD_DIR=/tmp/downloads

echo "✅ Deployment complete!"
echo "🌐 Frontend: $VERCEL_URL"
echo "🔗 Backend: Check Railway dashboard"
```

## ⚠️ **Free Tier Limitations**

1. **Railway/Fly.io**: Apps sleep after inactivity (cold starts)
2. **Bandwidth**: Limited monthly transfer
3. **Resources**: Lower CPU/memory than paid plans
4. **Support**: Community support only

## 💡 **Pro Tips for Free Hosting**

1. **Optimize builds**: Use smaller Docker images
2. **Cache dependencies**: Speed up deployments
3. **Monitor usage**: Stay within free limits
4. **Backup data**: Free tiers may lose data

## 🔄 **Upgrade Path**

When your app grows:
- Railway: $5/month for better performance
- Fly.io: $5/month for more resources
- Vercel: $20/month for backend functions

---

**Ready to deploy for free?** Run the script above or follow the step-by-step guides!

Instead of Docker, use a persistent Firefox service:

```yaml
services:
  - type: web
    name: firefox-service
    runtime: docker
    dockerfilePath: ./browser-container/Dockerfile
    dockerContext: ./browser-container
    envVars:
      - key: WEB_AUDIO
        value: "1"
    plan: starter
```

## 🦊 **Firefox Container (FREE on Fly.io)**

For the browser automation, deploy Firefox container to Fly.io (FREE):

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login to Fly.io
fly auth login

# 3. Deploy Firefox container
cd browser-container
fly launch --name traceless-firefox --no-deploy

# 4. Set environment variables
fly secrets set WEB_AUDIO=1

# 5. Deploy
fly deploy

# 6. Get the URL
fly status
```

**Update your backend environment variables:**
```bash
# In Railway dashboard, set:
VW_BROWSER_URL=https://traceless-firefox.fly.dev
```