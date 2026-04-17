const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response;
}

export const api = {
  startSession(durationMinutes) {
    return request("/start-session", {
      method: "POST",
      body: JSON.stringify({ duration_minutes: durationMinutes })
    });
  },
  getSession(sessionId) {
    return request(`/session/${sessionId}`);
  },
  listFiles(sessionId) {
    return request(`/files/${sessionId}`);
  },
  saveFile(sessionId, filename, content) {
    return request(`/files/${sessionId}`, {
      method: "POST",
      body: JSON.stringify({ filename, content })
    });
  },
  endSession(sessionId) {
    return request(`/end-session/${sessionId}`, { method: "DELETE" });
  },
  getFileUrl(sessionId, filename) {
    return `${API_BASE}/file/${sessionId}/${encodeURIComponent(filename)}`;
  },
  getEventsUrl(sessionId) {
    return `${API_BASE}/events/${sessionId}`;
  }
};
