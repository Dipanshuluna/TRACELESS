export function BrowserWindow({
  browserUrl,
  previewUrl,
  previewTitle,
  onOpenWorkspace,
  onClose,
  onMinimize,
  onFocus,
  onHeaderPointerDown,
  onResizePointerDown,
  style
}) {
  const activeUrl = previewUrl || browserUrl;
  const title = previewUrl ? previewTitle || "File Preview" : "Firefox Workspace";

  return (
    <section className="window browser-window floating-window" style={style} onPointerDown={onFocus}>
      <header className="window-header draggable-header" onPointerDown={onHeaderPointerDown}>
        <div className="window-title">
          <div className="window-icon browser-icon" aria-hidden="true">
            🌐
          </div>
          <div>
            <p className="window-label">Browser App</p>
            <h2>{title}</h2>
          </div>
        </div>
        <div className="window-controls">
          {previewUrl ? (
            <button type="button" onClick={onOpenWorkspace}>
              Back to browser
            </button>
          ) : (
            <>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </>
          )}
          <button type="button" className="window-minimize" onClick={onMinimize} aria-label="Minimize browser">
            _
          </button>
          <button type="button" className="window-close" onClick={onClose} aria-label="Close browser">
            ×
          </button>
        </div>
      </header>
      <div className="browser-frame">
        <iframe src={activeUrl} title="Volatile workspace browser window" />
      </div>
      <div
        className="window-resize-handle"
        onPointerDown={onResizePointerDown}
        aria-hidden="true"
      />
    </section>
  );
}
