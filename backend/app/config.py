import os
from dataclasses import dataclass


def _csv_paths(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(slots=True)
class Settings:
    frontend_origin: str = os.getenv("VW_FRONTEND_ORIGIN", "http://localhost:5173,https://traceless-koc9.onrender.com")
    browser_url: str = os.getenv("VW_BROWSER_URL", "http://localhost:3000")
    attached_container_name: str = os.getenv("VW_ATTACHED_CONTAINER_NAME", "firefox-container")
    max_session_minutes: int = int(os.getenv("VW_MAX_SESSION_MINUTES", "240"))
    cleanup_interval_seconds: int = int(os.getenv("VW_CLEANUP_INTERVAL_SECONDS", "15"))
    download_dir: str = os.getenv("VW_DOWNLOAD_DIR", "/config/downloads")
    stream_chunk_size: int = int(os.getenv("VW_STREAM_CHUNK_SIZE", str(1024 * 64)))
    end_session_stops_container: bool = (
        os.getenv("VW_END_SESSION_STOPS_CONTAINER", "false").lower() == "true"
    )
    reset_paths: tuple[str, ...] = _csv_paths(
        os.getenv(
            "VW_RESET_PATHS",
            "/config/downloads,/config/profile,/config/.mozilla",
        )
    )
