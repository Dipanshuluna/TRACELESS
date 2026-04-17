import { BrowserWindow } from "./BrowserWindow";
import { FileSystemWindow } from "./FileSystemWindow";
import { TextEditorWindow } from "./TextEditor";
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
  openEditor,
  closeBrowser,
  closeFiles,
  closeEditor,
  minimizeBrowser,
  minimizeFiles,
  minimizeEditor,
  focusWindow,
  beginDrag,
  beginResize,
  toggleTaskbarWindow,
  openFileInBrowser,
  openWorkspaceBrowser,
  saveEditorFile,
  sessionId,
  onEditorSaveComplete
}) {
  const browserWindow = windows.browser;
  const filesWindow = windows.files;
  const editorWindow = windows.editor;

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
          <button type="button" className="desktop-icon" onClick={openEditor}>
            <div className="desktop-icon-art editor-icon">📝</div>
            <span>Editor</span>
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
              onResizePointerDown={(event) => beginResize("browser", event)}
              style={{
                left: `${browserWindow.x}px`,
                top: `${browserWindow.y}px`,
                zIndex: browserWindow.z,
                width: `${browserWindow.width}px`,
                height: `${browserWindow.height}px`
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
                zIndex: filesWindow.z,
                width: `${filesWindow.width}px`,
                height: `${filesWindow.height}px`
              }}
            />
          ) : null}
          {editorWindow.open && !editorWindow.minimized ? (
            <TextEditorWindow
              sessionId={sessionId}
              saveFile={saveEditorFile}
              onSaveComplete={onEditorSaveComplete}
              onMinimize={minimizeEditor}
              onClose={closeEditor}
              onFocus={() => focusWindow("editor")}
              onHeaderPointerDown={(event) => beginDrag("editor", event)}
              style={{
                left: `${editorWindow.x}px`,
                top: `${editorWindow.y}px`,
                zIndex: editorWindow.z,
                width: `${editorWindow.width}px`,
                height: `${editorWindow.height}px`
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
