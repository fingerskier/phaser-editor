import { useState } from "react";
import { OBJ_TYPES } from "../constants";
import type { Scene, ViewMode } from "../types";

interface ViewBarProps {
  viewMode: ViewMode;
  activeScene: Scene | undefined;
  onSetViewMode: (mode: ViewMode) => void;
  onAddObject: (objType: string) => void;
}

export function ViewBar({
  viewMode,
  activeScene,
  onSetViewMode,
  onAddObject,
}: ViewBarProps) {
  const [addDrop, setAddDrop] = useState(false);

  return (
    <div className="view-bar">
      <div
        className={`view-tab ${viewMode === "canvas" ? "act" : ""}`}
        onClick={() => onSetViewMode("canvas")}
      >
        🎮 Stage
      </div>
      <div
        className={`view-tab ${viewMode === "code" ? "act" : ""}`}
        onClick={() => onSetViewMode("code")}
      >
        ⟨/⟩ Code
      </div>
      {activeScene && (
        <div className="view-scene-name">
          <span className="view-scene-dot" />
          {activeScene.name}
          <span style={{ color: "var(--txt3)", fontSize: 10 }}>
            — {activeScene.objects.length} objects
          </span>
        </div>
      )}
      <div className="spacer" />
      {viewMode === "canvas" && (
        <div style={{ position: "relative" }}>
          <button
            className="btn prim"
            style={{ fontSize: 11, padding: "3px 10px" }}
            onClick={() => setAddDrop((v) => !v)}
          >
            + Add Object
          </button>
          {addDrop && (
            <div className="add-dd" style={{ right: 0, left: "auto" }}>
              {Object.entries(OBJ_TYPES).map(([key, cfg]) => (
                <div
                  key={key}
                  className="add-dd-i"
                  onClick={() => {
                    onAddObject(key);
                    setAddDrop(false);
                  }}
                >
                  <div
                    className="add-dd-dot"
                    style={{ background: cfg.color, color: "white" }}
                  >
                    {cfg.icon}
                  </div>
                  {cfg.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
