# Alternative: Simplified Render Deployment

If Docker-in-Docker doesn't work, here's a simplified approach:

## Option 1: Backend Only (API + Static Frontend)

Deploy just the backend with the frontend built into it:

```yaml
services:
  - type: web
    name: traceless-app
    runtime: python3
    buildCommand: |
      cd backend && pip install -r requirements.txt
      cd ../frontend && npm install && npm run build
      cp -r dist ../backend/static
    startCommand: "cd backend && gunicorn --bind 0.0.0.0:$PORT app:app"
    envVars:
      - key: VW_FRONTEND_ORIGIN
        value: https://traceless-app.onrender.com
      - key: VW_BROWSER_URL
        value: https://traceless-firefox.onrender.com
      - key: VW_DOWNLOAD_DIR
        value: /tmp/downloads
    plan: starter
```

## Option 2: Separate Frontend Deployment

Deploy frontend as static site, backend as API:

```yaml
services:
  # Backend API
  - type: web
    name: traceless-backend
    runtime: python3
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && gunicorn --bind 0.0.0.0:$PORT app:app"

  # Frontend (Static Site)
  - type: web
    name: traceless-frontend
    runtime: static
    buildCommand: "cd frontend && npm install && npm run build"
    staticPublishPath: ./frontend/dist
```

## Firefox Container Alternative

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