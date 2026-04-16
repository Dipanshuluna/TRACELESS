import { useEffect, useRef, useState } from "react";
import { api } from "./api/client";
import { DesktopShell } from "./components/DesktopShell";
import { SessionLauncher } from "./components/SessionLauncher";

function createDefaultWindows() {
  return {
    browser: { open: false, minimized: false, x: 70, y: 24, z: 2 },
    files: { open: false, minimized: false, x: 760, y: 90, z: 3 }
  };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [browserUrl, setBrowserUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [browserPreviewUrl, setBrowserPreviewUrl] = useState("");
  const [browserPreviewTitle, setBrowserPreviewTitle] = useState("");
  const [windows, setWindows] = useState(createDefaultWindows);
  const dragRef = useRef(null);
  const eventSourceRef = useRef(null);
  const zRef = useRef(10);

  const resetDesktop = () => {
    setWindows(createDefaultWindows());
    setBrowserPreviewUrl("");
    setBrowserPreviewTitle("");
  };

  const closeEventStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const refreshFiles = async (sessionId = session?.session_id) => {
    if (!sessionId) return;

    setIsFilesLoading(true);
    try {
      const response = await api.listFiles(sessionId);
      setFiles(response.files);
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setIsFilesLoading(false);
    }
  };

  const focusWindow = (windowId) => {
    zRef.current += 1;
    setWindows((current) => ({
      ...current,
      [windowId]: {
        ...current[windowId],
        z: zRef.current
      }
    }));
  };

  const openWindow = (windowId) => {
    zRef.current += 1;
    setWindows((current) => ({
      ...current,
      [windowId]: {
        ...current[windowId],
        open: true,
        minimized: false,
        z: zRef.current
      }
    }));
  };

  const minimizeWindow = (windowId) => {
    setWindows((current) => ({
      ...current,
      [windowId]: {
        ...current[windowId],
        minimized: true
      }
    }));
  };

  const closeWindow = (windowId) => {
    setWindows((current) => ({
      ...current,
      [windowId]: {
        ...current[windowId],
        open: false,
        minimized: false
      }
    }));
  };

  const toggleTaskbarWindow = (windowId) => {
    const windowState = windows[windowId];
    if (!windowState.open) {
      openWindow(windowId);
      return;
    }
    if (windowState.minimized) {
      openWindow(windowId);
      return;
    }
    minimizeWindow(windowId);
  };

  const beginDrag = (windowId, event) => {
    if (event.target.closest("button")) return;
    const windowState = windows[windowId];
    focusWindow(windowId);
    dragRef.current = {
      windowId,
      offsetX: event.clientX - windowState.x,
      offsetY: event.clientY - windowState.y
    };
  };

  const openEventStream = (sessionId) => {
    closeEventStream();
    const source = new EventSource(api.getEventsUrl(sessionId));
    source.addEventListener("snapshot", (event) => {
      const payload = JSON.parse(event.data);
      setSession({
        ...payload.session,
        secondsRemaining: payload.session.seconds_remaining
      });
      setFiles(payload.files);
      setHealth(payload.health);
      setError("");
      setIsFilesLoading(false);
    });
    source.addEventListener("session-ended", () => {
      closeEventStream();
      setSession(null);
      setFiles([]);
      setHealth(null);
      resetDesktop();
    });
    source.onerror = () => {
      source.close();
    };
    eventSourceRef.current = source;
  };

  const startSession = async (duration) => {
    setIsStarting(true);
    setError("");
    try {
      const response = await api.startSession(duration);
      setSession({
        ...response.session,
        secondsRemaining: response.session.seconds_remaining
      });
      setBrowserUrl(response.browser_url);
      setHealth(null);
      setFiles([]);
      resetDesktop();
      await refreshFiles(response.session.session_id);
      openEventStream(response.session.session_id);
    } catch (startError) {
      setError(startError.message);
    } finally {
      setIsStarting(false);
    }
  };

  const endSession = async () => {
    if (!session?.session_id) return;

    try {
      await api.endSession(session.session_id);
    } catch (endError) {
      setError(endError.message);
    } finally {
      closeEventStream();
      setSession(null);
      setFiles([]);
      setHealth(null);
      setBrowserUrl("");
      resetDesktop();
    }
  };

  const openFileInBrowser = (file) => {
    if (!session?.session_id) return;

    setBrowserPreviewUrl(api.getFileUrl(session.session_id, file.path));
    setBrowserPreviewTitle(file.name);
    openWindow("browser");
  };

  const openWorkspaceBrowser = () => {
    setBrowserPreviewUrl("");
    setBrowserPreviewTitle("");
    openWindow("browser");
  };

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragRef.current) return;
      const { windowId, offsetX, offsetY } = dragRef.current;
      setWindows((current) => ({
        ...current,
        [windowId]: {
          ...current[windowId],
          x: Math.max(16, event.clientX - offsetX),
          y: Math.max(16, event.clientY - offsetY)
        }
      }));
    };

    const handleUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  useEffect(() => closeEventStream, []);

  if (!session) {
    return <SessionLauncher onStart={startSession} isLoading={isStarting} error={error} />;
  }

  return (
    <DesktopShell
      session={session}
      browserUrl={browserUrl}
      browserPreviewUrl={browserPreviewUrl}
      browserPreviewTitle={browserPreviewTitle}
      files={files}
      health={health}
      isFilesLoading={isFilesLoading}
      refreshFiles={() => refreshFiles()}
      onEnd={endSession}
      windows={windows}
      openBrowser={openWorkspaceBrowser}
      openFiles={() => openWindow("files")}
      closeBrowser={() => closeWindow("browser")}
      closeFiles={() => closeWindow("files")}
      minimizeBrowser={() => minimizeWindow("browser")}
      minimizeFiles={() => minimizeWindow("files")}
      focusWindow={focusWindow}
      beginDrag={beginDrag}
      toggleTaskbarWindow={toggleTaskbarWindow}
      openFileInBrowser={openFileInBrowser}
      openWorkspaceBrowser={openWorkspaceBrowser}
    />
  );
}
