import { useState } from "react";
import type { ProjectConfig } from "../types";

interface TopbarProps {
  projectName: string;
  config: ProjectConfig;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onNew: () => void;
}

export function Topbar({
  projectName,
  config,
  onSave,
  onExport,
  onImport,
  onNew,
}: TopbarProps) {
  const [fileDrop, setFileDrop] = useState(false);

  return (
    <div className="topbar">
      <div className="logo">
        ⬡ PHASER<span>.STUDIO</span>
      </div>

      <div style={{ position: "relative" }}>
        <button
          className="btn"
          style={{ fontSize: 11, padding: "3px 10px" }}
          onClick={() => setFileDrop((v) => !v)}
        >
          File ▾
        </button>
        {fileDrop && (
          <div className="add-dd" style={{ left: 0 }}>
            <div
              className="add-dd-i"
              onClick={() => { onNew(); setFileDrop(false); }}
            >
              New Project
            </div>
            <div
              className="add-dd-i"
              onClick={() => { onSave(); setFileDrop(false); }}
            >
              Save
            </div>
            <div
              className="add-dd-i"
              onClick={() => { onExport(); setFileDrop(false); }}
            >
              Export .json
            </div>
            <div
              className="add-dd-i"
              onClick={() => { onImport(); setFileDrop(false); }}
            >
              Import .json
            </div>
          </div>
        )}
      </div>

      <div className="proj">{projectName}</div>
      <div className="spacer" />
      <div className="cfg">
        <span className="cfg-b">
          {config.width}×{config.height}
        </span>
        <span className="cfg-b">{config.physics}</span>
        <span className="cfg-b">{config.pixelArt ? "pixel" : "smooth"}</span>
      </div>
    </div>
  );
}
