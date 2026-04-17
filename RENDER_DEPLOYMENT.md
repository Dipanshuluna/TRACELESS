# Render Deployment Guide for Traceless

## 🚀 Quick Deploy

1. **Connect your GitHub repository** to Render
2. **Create a new Blueprint** from the `render.yaml` file
3. **Update service URLs** in environment variables after deployment

## 📋 Services Overview

### Backend Service (`traceless-backend`)
- **Runtime**: Python 3
- **Build**: `cd backend && pip install -r requirements.txt`
- **Start**: `cd backend && gunicorn --bind 0.0.0.0:$PORT app:app`
- **Environment Variables**:
  - `VW_FRONTEND_ORIGIN`: Your frontend URL (update after deploy)
  - `VW_BROWSER_URL`: Firefox container URL (update after deploy)
  - `VW_DOWNLOAD_DIR`: `/tmp/downloads` (ephemeral storage)

### Frontend Service (`traceless-frontend`)
- **Runtime**: Node.js
- **Build**: `cd frontend && npm install && npm run build`
- **Start**: `cd frontend && npx serve -s dist -l $PORT`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: Your backend API URL (update after deploy)

### Firefox Container (`firefox-container`)
- **Runtime**: Docker
- **Image**: Custom Firefox container
- **Port**: Automatically assigned by Render (typically 10000+)
- **Environment Variables**:
  - `WEB_AUDIO`: "1"

## ⚠️ Important Notes

### Docker-in-Docker Limitation
Render doesn't provide Docker socket access, so the backend cannot dynamically manage containers. You'll need to:

1. **Deploy the Firefox container separately** as a standalone service
2. **Update the backend environment variables** with the actual Firefox service URL
3. **Consider using a persistent Firefox service** instead of ephemeral containers

### Alternative Architecture
For production, consider:
- Using a dedicated VM/server with Docker support (AWS EC2, DigitalOcean)
- Using container orchestration (Kubernetes, Docker Swarm)
- Using a managed container service (AWS ECS, Google Cloud Run)

### Environment Variables to Update
After deployment, update these URLs in your Render dashboard:

```bash
# Backend service environment variables
VW_FRONTEND_ORIGIN=https://your-frontend-app.onrender.com
VW_BROWSER_URL=https://your-firefox-container-app.onrender.com

# Frontend service environment variables
VITE_API_BASE_URL=https://your-backend-app.onrender.com/api
```

**Note**: Render automatically assigns ports and URLs to your services. You'll need to update the `VW_BROWSER_URL` with the actual URL that Render assigns to your Firefox container service.

## 🔧 Manual Deployment Steps

If blueprint deployment fails:

1. **Deploy Firefox Container First**:
   ```bash
   # Create a new Web Service on Render
   # Runtime: Docker
   # Dockerfile Path: ./browser-container/Dockerfile
   # Context: ./browser-container
   ```

2. **Deploy Backend**:
   ```bash
   # Create a new Web Service on Render
   # Runtime: Python 3
   # Build Command: cd backend && pip install -r requirements.txt
   # Start Command: cd backend && gunicorn --bind 0.0.0.0:$PORT app:app
   ```

3. **Deploy Frontend**:
   ```bash
   # Create a new Web Service on Render
   # Runtime: Node
   # Build Command: cd frontend && npm install && npm run build
   # Start Command: cd frontend && npx serve -s dist -l $PORT
   ```

## 🐛 Troubleshooting

### Backend Connection Issues
- Ensure `VW_BROWSER_URL` points to your Firefox container service
- Check that the Firefox container is running and accessible

### CORS Issues
- Update `VW_FRONTEND_ORIGIN` with your exact frontend URL
- Include `https://` protocol

### File Upload Issues
- Files are stored in `/tmp/downloads` (ephemeral)
- Consider adding persistent storage for production

## 💰 Cost Estimation

- **3 Starter Services**: ~$7/month total
- **Free tier**: 750 hours/month combined
- **Paid tier**: $7/month per service beyond free limits

## 🔒 Security Considerations

- Update session timeouts for production (`VW_MAX_SESSION_MINUTES`)
- Consider adding authentication
- Use HTTPS (Render provides this automatically)
- Monitor resource usage

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test service connectivity
4. Consider the Docker limitations mentioned above