const APP_META = {
  browser: "Browser",
  files: "Files",
  editor: "Editor"
};

export function Taskbar({ session, health, windows, onEnd, onToggleWindow }) {
  const minutes = Math.floor(session.secondsRemaining / 60);
  const seconds = session.secondsRemaining % 60;
  const healthLabel = health?.browser_available ? "Browser healthy" : "Checking container";

  return (
    <footer className="taskbar">
      <div className="taskbar-start">
        <button type="button" className="start-button">
          Start
        </button>
        <div className="taskbar-brand">
          <strong>Volatile Workspace</strong>
          <span>Session {session.session_id.slice(0, 8)}</span>
        </div>
      </div>
      <div className="taskbar-actions">
        <div className="taskbar-apps">
          {Object.entries(APP_META).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`taskbar-app ${windows[key].open && !windows[key].minimized ? "active" : ""}`}
              onClick={() => onToggleWindow(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={`status-pill ${health?.browser_available ? "healthy" : "degraded"}`}>
          {healthLabel}
        </span>
        <span className="timer-pill">
          {minutes}:{String(seconds).padStart(2, "0")} remaining
        </span>
        <button type="button" className="danger-button" onClick={onEnd}>
          End session
        </button>
      </div>
    </footer>
  );
}
