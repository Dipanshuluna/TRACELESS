from __future__ import annotations

import mimetypes
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import PurePosixPath

from docker.errors import DockerException, NotFound

from ..config import Settings
from ..models import SessionRecord
from .docker_client import DockerGateway


class SessionManager:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.gateway = None if settings.disable_docker else DockerGateway()
        self._sessions: dict[str, SessionRecord] = {}
        self._lock = threading.RLock()
        self._cleanup_thread: threading.Thread | None = None

    def start_cleanup_loop(self) -> None:
        if self._cleanup_thread and self._cleanup_thread.is_alive():
            return

        def _loop() -> None:
            while True:
                self.expire_sessions()
                threading.Event().wait(self.settings.cleanup_interval_seconds)

        self._cleanup_thread = threading.Thread(target=_loop, name="vw-cleanup", daemon=True)
        self._cleanup_thread.start()

    def start_session(self, duration_minutes: int) -> SessionRecord:
        if duration_minutes <= 0 or duration_minutes > self.settings.max_session_minutes:
            raise ValueError(
                f"duration_minutes must be between 1 and {self.settings.max_session_minutes}"
            )

        existing_session: SessionRecord | None = None
        with self._lock:
            active_session = next(iter(self._sessions.values()), None)
            if active_session is not None and active_session.seconds_remaining() > 0:
                existing_session = self._sessions.pop(active_session.session_id, None)

        if existing_session is not None and not self.settings.disable_docker:
            if self.settings.end_session_stops_container:
                self._remove_container(existing_session)
            else:
                self._reset_attached_container(existing_session.container_id)

        if self.settings.disable_docker:
            container_id = "render-no-docker"
            container_name = "render-no-docker"
        else:
            try:
                container = self._require_gateway().get_container_by_name(
                    self.settings.attached_container_name
                )
            except NotFound as exc:
                raise RuntimeError(
                    f"container '{self.settings.attached_container_name}' was not found"
                ) from exc
            self._reset_attached_container(container.id)
            container_id = container.id
            container_name = container.name

        session_id = uuid.uuid4().hex
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=duration_minutes)

        session = SessionRecord(
            session_id=session_id,
            container_id=container_id,
            container_name=container_name,
            duration_minutes=duration_minutes,
            started_at=now,
            expires_at=expires_at,
            browser_url=self.settings.browser_url,
            metadata={
                "download_dir": self.settings.download_dir,
                "mode": "render-browser-url" if self.settings.disable_docker else "attached-container",
            },
        )
        with self._lock:
            self._sessions[session_id] = session
        return session

    def session_snapshot(self, session_id: str) -> dict:
        session = self._require_session(session_id)
        return {
            "session": session.to_dict(),
            "files": self.list_files(session_id),
            "health": self.get_health(session_id),
        }

    def get_session(self, session_id: str) -> SessionRecord | None:
        with self._lock:
            return self._sessions.get(session_id)

    def list_files(self, session_id: str) -> list[dict]:
        session = self._require_session(session_id)
        if self.settings.disable_docker:
            return []
        files = self._require_gateway().list_directory(session.container_id, self.settings.download_dir)
        return [
            {
                "name": item["name"],
                "size_bytes": item["size_bytes"],
                "modified_at": item["modified_at"],
                "path": item["path"],
            }
            for item in files
        ]

    def save_file(self, session_id: str, filename: str, content: str) -> dict:
        session = self._require_session(session_id)
        if self.settings.disable_docker:
            raise RuntimeError("saving files is unavailable when VW_DISABLE_DOCKER=true")
        safe_path = self._safe_container_path(filename)
        if not safe_path:
            raise ValueError("filename must not be empty")

        absolute_path = f"{self.settings.download_dir}/{safe_path}".replace("//", "/")
        data = content.encode("utf-8")
        self._require_gateway().write_file_bytes(session.container_id, absolute_path, data)

        now = datetime.now(timezone.utc)
        return {
            "name": PurePosixPath(safe_path).name,
            "path": safe_path,
            "size_bytes": len(data),
            "modified_at": now.isoformat(),
        }

    def stream_file(self, session_id: str, filename: str):
        session = self._require_session(session_id)
        if self.settings.disable_docker:
            raise RuntimeError("file streaming is unavailable when VW_DISABLE_DOCKER=true")
        safe_path = self._safe_container_path(filename)
        absolute_path = f"{self.settings.download_dir}/{safe_path}".replace("//", "/")
        stream, size = self._require_gateway().stream_file_bytes(session.container_id, absolute_path)
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        headers = {
            "Content-Length": str(size),
            "Content-Disposition": f'inline; filename="{PurePosixPath(filename).name}"',
        }
        return stream, content_type, headers

    def end_session(self, session_id: str) -> bool:
        with self._lock:
            session = self._sessions.pop(session_id, None)
            if session is None:
                # Frontend may hold a stale session ID after backend restart/reload.
                # Fallback to the currently active session so "End session" still works.
                active_id = next(
                    (
                        sid
                        for sid, record in self._sessions.items()
                        if record.seconds_remaining() > 0
                    ),
                    None,
                )
                if active_id is not None:
                    session = self._sessions.pop(active_id, None)
        if session is None:
            return False
        if self.settings.disable_docker:
            return True
        if self.settings.end_session_stops_container:
            self._remove_container(session)
        else:
            self._reset_attached_container(session.container_id)
        return True

    def get_health(self, session_id: str | None = None) -> dict:
        if self.settings.disable_docker:
            browser_available = DockerGateway.probe_http(self.settings.browser_url)
            return {
                "docker_available": False,
                "container_found": False,
                "container_status": "disabled",
                "browser_url": self.settings.browser_url,
                "browser_available": browser_available,
                "downloads_path": self.settings.download_dir,
                "downloads_accessible": False,
            }

        gateway = self._require_gateway()
        container_name = self.settings.attached_container_name
        try:
            if session_id is None:
                container = gateway.get_container_by_name(container_name)
            else:
                session = self._require_session(session_id)
                container = gateway.inspect_container(session.container_id)
            container.reload()
            browser_available = gateway.probe_http(self.settings.browser_url)
            downloads_ready = gateway.is_directory_empty(
                container.id, self.settings.download_dir
            )
            return {
                "docker_available": gateway.ping(),
                "container_found": True,
                "container_status": container.status,
                "browser_url": self.settings.browser_url,
                "browser_available": browser_available,
                "downloads_path": self.settings.download_dir,
                "downloads_accessible": downloads_ready,
            }
        except NotFound:
            return {
                "docker_available": gateway.ping(),
                "container_found": False,
                "container_status": "missing",
                "browser_url": self.settings.browser_url,
                "browser_available": False,
                "downloads_path": self.settings.download_dir,
                "downloads_accessible": False,
            }
        except Exception as exc:
            return {
                "docker_available": gateway.ping(),
                "container_found": True,
                "container_status": "unknown",
                "browser_url": self.settings.browser_url,
                "browser_available": False,
                "downloads_path": self.settings.download_dir,
                "downloads_accessible": False,
                "error": str(exc),
            }

    def expire_sessions(self) -> None:
        expired_ids: list[str] = []
        with self._lock:
            for session_id, session in self._sessions.items():
                if session.seconds_remaining() == 0:
                    expired_ids.append(session_id)
            expired = [self._sessions.pop(session_id) for session_id in expired_ids]

        for session in expired:
            if self.settings.disable_docker:
                continue
            if self.settings.end_session_stops_container:
                self._remove_container(session)
            else:
                self._reset_attached_container(session.container_id)

    def _require_session(self, session_id: str) -> SessionRecord:
        session = self.get_session(session_id)
        if session is not None:
            return session

        # If the client has a stale session ID but there is exactly one active
        # in-memory session, use it to keep file/browser APIs functional.
        with self._lock:
            active_session = next(
                (record for record in self._sessions.values() if record.seconds_remaining() > 0),
                None,
            )
        if active_session is not None:
            return active_session

        raise FileNotFoundError(f"unknown session {session_id}")

    def _remove_container(self, session: SessionRecord) -> None:
        gateway = self._require_gateway()
        try:
            gateway.remove_container(session.container_id)
        except NotFound:
            return
        except DockerException as exc:
            session.last_error = str(exc)

    def _reset_attached_container(self, container_id: str) -> None:
        gateway = self._require_gateway()
        try:
            gateway.reset_paths(container_id, self.settings.reset_paths)
            gateway.restart_container(container_id)
            gateway.wait_for_running(container_id)
            self._wait_for_browser_ready()
            if not gateway.is_directory_empty(container_id, self.settings.download_dir):
                raise RuntimeError("download directory was not empty after reset")
        except NotFound as exc:
            raise RuntimeError(
                f"container '{self.settings.attached_container_name}' was not found"
            ) from exc
        except DockerException as exc:
            raise RuntimeError(f"failed to reset attached container: {exc}") from exc
        except RuntimeError as exc:
            raise RuntimeError(f"failed to wipe attached container state: {exc}") from exc

    def _wait_for_browser_ready(self, timeout_seconds: int = 30) -> None:
        gateway = self._require_gateway()
        deadline = time.monotonic() + timeout_seconds
        while time.monotonic() < deadline:
            if gateway.probe_http(self.settings.browser_url):
                return
            time.sleep(1)
        raise RuntimeError("browser UI did not become reachable after container reset")

    def _require_gateway(self) -> DockerGateway:
        if self.gateway is None:
            raise RuntimeError("docker gateway is unavailable")
        return self.gateway

    @staticmethod
    def _safe_container_path(filename: str) -> str:
        path = PurePosixPath(filename)
        safe_parts = [part for part in path.parts if part not in {"..", ".", "/"}]
        return str(PurePosixPath(*safe_parts))
