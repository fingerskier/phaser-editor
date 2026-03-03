import { useCallback, useEffect, useRef, useState } from "react";
import { generatePreviewHtml } from "../generatePreviewHtml";
import type { PreviewConsoleMessage, Project } from "../types";

interface GamePreviewProps {
  project: Project;
}

export function GamePreview({ project }: GamePreviewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [consoleMsgs, setConsoleMsgs] = useState<PreviewConsoleMessage[]>([]);
  const [showConsole, setShowConsole] = useState(true);
  const [html, setHtml] = useState("");
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const play = useCallback(() => {
    setConsoleMsgs([]);
    setHtml(generatePreviewHtml(project));
    setIsRunning(true);
  }, [project]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setHtml("");
  }, []);

  const restart = useCallback(() => {
    setIsRunning(false);
    setHtml("");
    // Defer so iframe unmounts before remounting
    requestAnimationFrame(() => {
      setConsoleMsgs([]);
      setHtml(generatePreviewHtml(project));
      setIsRunning(true);
    });
  }, [project]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "phaser-preview-console") {
        setConsoleMsgs((prev) => [
          ...prev,
          {
            level: e.data.level,
            args: e.data.args,
            timestamp: e.data.timestamp,
          },
        ]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleMsgs]);

  return (
    <div className="preview-wrap">
      <div className="preview-toolbar">
        {!isRunning ? (
          <button className="btn prim" onClick={play}>
            ▶ Play
          </button>
        ) : (
          <>
            <button className="btn dng" onClick={stop}>
              ■ Stop
            </button>
            <button className="btn" onClick={restart}>
              ↻ Restart
            </button>
          </>
        )}
        <div
          className="preview-console-toggle"
          onClick={() => setShowConsole((v) => !v)}
        >
          Console
          {consoleMsgs.length > 0 && (
            <span className="badge">{consoleMsgs.length}</span>
          )}
        </div>
      </div>

      <div className="preview-frame-wrap">
        {isRunning && html ? (
          <iframe
            srcDoc={html}
            sandbox="allow-scripts"
            width={project.config.width}
            height={project.config.height}
            title="Game Preview"
          />
        ) : (
          <div className="preview-stopped">
            <div className="preview-stopped-icon">▶</div>
            <p>Click Play to run your game</p>
            <button className="btn prim" onClick={play}>
              ▶ Play
            </button>
          </div>
        )}
      </div>

      {showConsole && (
        <div className="preview-console">
          <div className="preview-console-header">
            <span>Console ({consoleMsgs.length})</span>
            <button onClick={() => setConsoleMsgs([])}>Clear</button>
          </div>
          <div className="preview-console-body">
            {consoleMsgs.map((m, i) => (
              <div key={i} className={`console-msg ${m.level}`}>
                {m.args.join(" ")}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
