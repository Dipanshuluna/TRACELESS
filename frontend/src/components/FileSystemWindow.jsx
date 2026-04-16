export function FileSystemWindow({
  files,
  refreshFiles,
  isLoading,
  onClose,
  onOpenFile,
  onMinimize,
  onFocus,
  onHeaderPointerDown,
  style
}) {
  const totalSize = files.reduce((sum, file) => sum + file.size_bytes, 0);

  return (
    <section className="window files-window floating-window" style={style} onPointerDown={onFocus}>
      <header className="window-header draggable-header" onPointerDown={onHeaderPointerDown}>
        <div className="window-title">
          <div className="window-icon files-icon" aria-hidden="true">
            📁
          </div>
          <div className="files-heading">
            <p className="window-label">Virtual File System</p>
            <h2>Container Downloads</h2>
            <span className="files-subtitle">Ephemeral downloads inside the attached Firefox container</span>
          </div>
        </div>
        <div className="files-toolbar">
          <button type="button" onClick={refreshFiles} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className="window-minimize" onClick={onMinimize} aria-label="Minimize files">
            _
          </button>
          <button type="button" className="window-close" onClick={onClose} aria-label="Close files">
            ×
          </button>
        </div>
      </header>

      <div className="files-chrome">
        <div className="files-pathbar">
          <span className="files-label">Location</span>
          <div className="files-path">/config/downloads</div>
        </div>
        <div className="files-stats">
          <div className="files-stat-card">
            <span className="files-stat-label">Items</span>
            <strong>{files.length}</strong>
          </div>
          <div className="files-stat-card">
            <span className="files-stat-label">Storage</span>
            <strong>{formatSize(totalSize)}</strong>
          </div>
        </div>
      </div>

      <div className="file-list">
        {files.length === 0 ? (
          <p className="empty-state">
            No downloaded files found yet in `/config/downloads`.
          </p>
        ) : (
          <>
            <div className="file-table-head">
              <span>Name</span>
              <span>Modified</span>
              <span>Size</span>
              <span>Action</span>
            </div>
            {files.map((file) => (
              <article key={file.path} className="file-row">
                <div className="file-name-cell">
                  <div className="file-glyph" aria-hidden="true">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="file-name-meta">
                    <strong>{file.name}</strong>
                    <span>{file.path}</span>
                  </div>
                </div>
                <span className="file-date">{formatDate(file.modified_at)}</span>
                <span className="file-size">{formatSize(file.size_bytes)}</span>
                <div className="file-actions">
                  <button type="button" onClick={() => onOpenFile(file)}>
                    Open
                  </button>
                </div>
              </article>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function getFileIcon(name) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) return "🖼";
  if (["pdf"].includes(extension)) return "📕";
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "🗜";
  if (["mp4", "mov", "mkv", "avi"].includes(extension)) return "🎞";
  if (["mp3", "wav", "ogg"].includes(extension)) return "🎵";
  if (["txt", "md", "json", "csv", "log"].includes(extension)) return "📄";
  return "📦";
}
