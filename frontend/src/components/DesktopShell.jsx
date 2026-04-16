import { BrowserWindow } from "./BrowserWindow";
import { FileSystemWindow } from "./FileSystemWindow";
import { Taskbar } from "./Taskbar";

export function DesktopShell({
  session,
  browserUrl,
  browserPreviewUrl,
  browserPreviewTitle,
  files,
  health,
  isFilesLoading,
  refreshFiles,
  onEnd,
  windows,
  openBrowser,
  openFiles,
  closeBrowser,
  closeFiles,
  minimizeBrowser,
  minimizeFiles,
  focusWindow,
  beginDrag,
  toggleTaskbarWindow,
  openFileInBrowser,
  openWorkspaceBrowser
}) {
  const browserWindow = windows.browser;
  const filesWindow = windows.files;

  return (
    <main className="desktop-shell">
      <section className="desktop-stage">
        <aside className="desktop-icons" aria-label="Desktop apps">
          <button type="button" className="desktop-icon" onClick={openBrowser}>
            <div className="desktop-icon-art browser-icon">🌐</div>
            <span>Browser</span>
          </button>
          <button type="button" className="desktop-icon" onClick={openFiles}>
            <div className="desktop-icon-art files-icon">📁</div>
            <span>Files</span>
          </button>
        </aside>

        <section className="desktop-grid">
          {browserWindow.open && !browserWindow.minimized ? (
            <BrowserWindow
              browserUrl={browserUrl}
              previewUrl={browserPreviewUrl}
              previewTitle={browserPreviewTitle}
              onOpenWorkspace={openWorkspaceBrowser}
              onMinimize={minimizeBrowser}
              onClose={closeBrowser}
              onFocus={() => focusWindow("browser")}
              onHeaderPointerDown={(event) => beginDrag("browser", event)}
              style={{
                left: `${browserWindow.x}px`,
                top: `${browserWindow.y}px`,
                zIndex: browserWindow.z
              }}
            />
          ) : null}
          {filesWindow.open && !filesWindow.minimized ? (
            <FileSystemWindow
              files={files}
              refreshFiles={refreshFiles}
              isLoading={isFilesLoading}
              onMinimize={minimizeFiles}
              onClose={closeFiles}
              onOpenFile={openFileInBrowser}
              onFocus={() => focusWindow("files")}
              onHeaderPointerDown={(event) => beginDrag("files", event)}
              style={{
                left: `${filesWindow.x}px`,
                top: `${filesWindow.y}px`,
                zIndex: filesWindow.z
              }}
            />
          ) : null}
        </section>
      </section>
      <Taskbar
        session={session}
        health={health}
        windows={windows}
        onEnd={onEnd}
        onToggleWindow={toggleTaskbarWindow}
      />
    </main>
  );
}
