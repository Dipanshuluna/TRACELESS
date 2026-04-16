# Volatile Workspace

Volatile Workspace is a full-stack mini operating system for temporary, container-aware browsing and file handling. In this localhost setup, the app attaches to one existing Firefox container, exposes its web UI inside React, reads downloads from inside the container, and ends access when the timer expires.

## Architecture

- `frontend/`: React desktop shell with session launcher, taskbar timer, embedded browser window, and virtual file viewer.
- `backend/`: Flask API that manages session lifecycle, container attachment, file listing, file streaming, and cleanup.
- `browser-container/`: Optional sample Firefox image from the original per-session design.

## Backend API

- `POST /api/start-session`: start a timed session.
- `GET /api/session/<session_id>`: inspect session metadata and countdown.
- `GET /api/files/<session_id>`: list downloaded files inside the container.
- `GET /api/file/<session_id>/<filename>`: stream a file directly from the container.
- `DELETE /api/end-session/<session_id>`: terminate the UI session and optionally stop the attached container.

## Security Model

- The backend attaches to a named localhost container, `firefox-container` by default.
- Downloads are read from `/config/downloads` inside the container and never copied to the host permanently by the app.
- Browser access is embedded from `http://localhost:3000` by default.
- Cleanup runs continuously in the backend and expires app sessions. By default it does not stop your existing Firefox container.

## Local Development

### Prerequisites

- Docker Engine with access to `/var/run/docker.sock`
- Python 3.12+
- Node.js 22+

### 1. Make sure your Firefox container is already running

Expected defaults:

- Container name: `firefox-container`
- Browser URL: `http://localhost:3000`
- Downloads path: `/config/downloads`

You can override these with:

- `VW_ATTACHED_CONTAINER_NAME`
- `VW_BROWSER_URL`
- `VW_DOWNLOAD_DIR`
- `VW_END_SESSION_STOPS_CONTAINER`
- `VW_RESET_PATHS`

### 2. Start the Flask API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 3. Start the React frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Visit `http://localhost:5173`, enter a duration, and start the session. The React UI will embed your existing Firefox web UI and poll the attached container for downloads.

## Container Lifecycle

1. The user enters a duration in minutes.
2. Flask verifies that the existing Firefox container is available and records an expiration timestamp.
3. React renders the mini desktop UI and embeds the configured localhost browser URL.
4. Downloaded files appear in the virtual file viewer through the backend file API.
5. On session start and session end, Flask wipes the configured browser-state paths inside the attached container and restarts it.
6. If `VW_END_SESSION_STOPS_CONTAINER=true`, Flask stops and removes the attached container instead of resetting it.

## Scaling Notes

- Move the in-memory session registry to Redis or PostgreSQL for multi-instance deployments.
- Replace direct Docker socket access with a session worker service if you need stronger control-plane isolation.
- Add authentication, rate limits, and a reverse proxy before exposing this beyond local or trusted environments.

## Bonus-Ready Extension Points

- Session extension endpoint and renewal UI
- Multi-user ownership and access controls
- Temporary file preview policies by MIME type
- Clipboard hardening and tighter egress rules
