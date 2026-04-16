from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone


@dataclass(slots=True)
class SessionRecord:
    session_id: str
    container_id: str
    container_name: str
    duration_minutes: int
    started_at: datetime
    expires_at: datetime
    browser_url: str
    status: str = "active"
    last_error: str | None = None
    metadata: dict[str, str] = field(default_factory=dict)

    def seconds_remaining(self) -> int:
        now = datetime.now(timezone.utc)
        remaining = int((self.expires_at - now).total_seconds())
        return max(remaining, 0)

    def to_dict(self) -> dict:
        payload = asdict(self)
        payload["started_at"] = self.started_at.isoformat()
        payload["expires_at"] = self.expires_at.isoformat()
        payload["seconds_remaining"] = self.seconds_remaining()
        return payload
