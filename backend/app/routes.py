import json
import time

from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context
from werkzeug.exceptions import BadRequest, NotFound

api = Blueprint("api", __name__)


def _manager():
    return current_app.extensions["session_manager"]


@api.post("/start-session")
def start_session():
    payload = request.get_json(silent=True) or {}
    duration = payload.get("duration_minutes")
    if not isinstance(duration, int):
        raise BadRequest("duration_minutes must be an integer")

    session = _manager().start_session(duration)
    return jsonify(
        {
            "session": session.to_dict(),
            "browser_url": session.browser_url,
        }
    )


@api.get("/session/<session_id>")
def get_session(session_id: str):
    session = _manager().get_session(session_id)
    if session is None:
        raise NotFound("session not found")
    return jsonify({"session": session.to_dict()})


@api.get("/files/<session_id>")
def list_files(session_id: str):
    files = _manager().list_files(session_id)
    return jsonify({"files": files})


@api.post("/files/<session_id>")
def save_file(session_id: str):
    payload = request.get_json(silent=True) or {}
    filename = payload.get("filename")
    content = payload.get("content")
    if not isinstance(filename, str) or not filename.strip():
        raise BadRequest("filename must be a non-empty string")
    if not isinstance(content, str):
        raise BadRequest("content must be a string")

    file_info = _manager().save_file(session_id, filename, content)
    return jsonify({"file": file_info})


@api.get("/file/<session_id>/<path:filename>")
def get_file(session_id: str, filename: str):
    stream, content_type, headers = _manager().stream_file(session_id, filename)
    return Response(stream, content_type=content_type, headers=headers)


@api.delete("/end-session/<session_id>")
def end_session(session_id: str):
    removed = _manager().end_session(session_id)
    if not removed:
        raise NotFound("session not found")
    return jsonify({"status": "ended", "session_id": session_id})


@api.get("/events/<session_id>")
def events(session_id: str):
    manager = _manager()

    @stream_with_context
    def generate():
        while True:
            session = manager.get_session(session_id)
            if session is None:
                yield "event: session-ended\ndata: {}\n\n"
                break
            snapshot = manager.session_snapshot(session_id)
            yield f"event: snapshot\ndata: {json.dumps(snapshot)}\n\n"
            time.sleep(2)

    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    }
    return Response(generate(), mimetype="text/event-stream", headers=headers)


@api.get("/health/<session_id>")
def session_health(session_id: str):
    return jsonify({"health": _manager().get_health(session_id)})


@api.get("/health")
def health():
    return jsonify({"status": "ok", "health": _manager().get_health()})
