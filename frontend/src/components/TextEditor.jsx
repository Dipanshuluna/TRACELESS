import { useState } from "react";

export function TextEditorWindow({
  sessionId,
  saveFile,
  onSaveComplete,
  onClose,
  onMinimize,
  onFocus,
  onHeaderPointerDown,
  style
}) {
  const [filename, setFilename] = useState("note.txt");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (!filename.trim()) {
      setMessage("Please enter a file name.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await saveFile(sessionId, filename, content);
      setMessage(`Saved ${filename}`);
      if (typeof onSaveComplete === "function") {
        onSaveComplete();
      }
    } catch (error) {
      setMessage(error.message || "Failed to save file.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="window editor-window floating-window" style={style} onPointerDown={onFocus}>
      <header className="window-header draggable-header" onPointerDown={onHeaderPointerDown}>
        <div className="window-title">
          <div className="window-icon editor-icon" aria-hidden="true">
            📝
          </div>
          <div>
            <p className="window-label">Text Editor</p>
            <h2>Notepad</h2>
          </div>
        </div>
        <div className="window-controls">
          <button type="button" onClick={onMinimize} aria-label="Minimize editor">
            _
          </button>
          <button type="button" className="window-close" onClick={onClose} aria-label="Close editor">
            ×
          </button>
        </div>
      </header>
      <div className="editor-controls">
        <label>
          File name
          <input
            type="text"
            value={filename}
            onChange={(event) => setFilename(event.target.value)}
            placeholder="example.txt"
          />
        </label>
        <button type="button" className="save-file-button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save file"}
        </button>
      </div>
      <div className="editor-body">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type your notes here..."
        />
      </div>
      {message ? <div className="editor-message">{message}</div> : null}
    </section>
  );
}
