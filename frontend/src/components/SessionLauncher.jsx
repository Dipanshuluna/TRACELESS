import { useState } from "react";

export function SessionLauncher({ onStart, isLoading, error }) {
  const [duration, setDuration] = useState(30);

  const handleSubmit = (event) => {
    event.preventDefault();
    onStart(duration);
  };

  return (
    <main className="launcher-shell">
      <section className="launcher-card">
        <p className="eyebrow">Secure Ephemeral Session</p>
        <h1>Volatile Workspace</h1>
        <p className="launcher-copy">
          Connect to the existing localhost Firefox workspace, keep downloads inside the
          container, and gate access with an expiring session timer.
        </p>
        <div className="launcher-meta">
          <span>Desktop UI</span>
          <span>Firefox container</span>
          <span>Auto reset per session</span>
        </div>

        <form className="launcher-form" onSubmit={handleSubmit}>
          <label htmlFor="duration">Session duration in minutes</label>
          <input
            id="duration"
            type="number"
            min="1"
            max="240"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Connecting workspace..." : "Open volatile session"}
          </button>
        </form>

        {error ? <p className="error-banner">{error}</p> : null}
      </section>
    </main>
  );
}
