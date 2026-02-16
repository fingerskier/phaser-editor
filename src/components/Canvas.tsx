import { useRef, useState } from "react";
import { OBJ_TYPES } from "../constants";
import { useDragging } from "../hooks/useDragging";
import type { GameObject, ProjectConfig, Scene } from "../types";

interface CanvasProps {
  scene: Scene;
  config: ProjectConfig;
  selectedObjId: string | null;
  selectedObj: GameObject | undefined;
  onSelectObj: (id: string | null) => void;
  onUpdateObj: (objId: string, updates: Partial<GameObject>) => void;
  onDeleteObject: (objId: string) => void;
}

export function Canvas({
  scene,
  config,
  selectedObjId,
  selectedObj,
  onSelectObj,
  onUpdateObj,
  onDeleteObject,
}: CanvasProps) {
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const { handleCanvasMouseDown } = useDragging({
    zoom,
    canvasRef,
    onUpdateObj,
    onSelectObj: (id: string) => onSelectObj(id),
  });

  return (
    <div
      className="canvas-wrap"
      onClick={() => onSelectObj(null)}
    >
      <div
        className="canvas-outer"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
      >
        <div
          ref={canvasRef}
          className="canvas-inner"
          style={{
            width: config.width,
            height: config.height,
            background: config.backgroundColor,
          }}
        >
          {showGrid && <div className="canvas-grid" />}
          {scene.objects
            .filter((o) => o.visible)
            .map((obj, i) => {
              const isText = obj.objType === "text";
              const isZone = obj.objType === "zone";
              const isCircle = obj.objType === "circle";

              return (
                <div
                  key={obj.id}
                  className={`gobj ${selectedObjId === obj.id ? "selected" : ""} ${obj.locked ? "locked" : ""}`}
                  style={{
                    left: obj.x - obj.w / 2,
                    top: obj.y - obj.h / 2,
                    width: obj.w,
                    height: obj.h,
                    background: isZone
                      ? `${obj.color}20`
                      : isText
                        ? "transparent"
                        : obj.color,
                    border: isZone
                      ? `1px dashed ${obj.color}60`
                      : "none",
                    borderRadius: isCircle
                      ? "50%"
                      : obj.objType === "sprite"
                        ? "3px"
                        : "1px",
                    zIndex: i + 1,
                    fontSize: isText ? 11 : 8,
                    color: isText ? obj.color : "rgba(255,255,255,0.5)",
                    boxShadow:
                      selectedObjId === obj.id
                        ? `0 0 12px ${obj.color}40`
                        : "none",
                    opacity: obj.locked ? 0.5 : 1,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObj(obj.id);
                  }}
                  onMouseDown={(e) => handleCanvasMouseDown(e, obj)}
                >
                  {(showLabels || selectedObjId === obj.id) && (
                    <div className="gobj-label">{obj.name}</div>
                  )}
                  {isText
                    ? (obj.props?.text as string) || obj.name
                    : OBJ_TYPES[obj.objType]?.icon}
                  {!obj.locked && (
                    <>
                      <div className="gobj-handle tl" />
                      <div className="gobj-handle tr" />
                      <div className="gobj-handle bl" />
                      <div className="gobj-handle br" />
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="canvas-zoom">
        <button
          className="zb"
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}
        >
          −
        </button>
        <span className="zl">{Math.round(zoom * 100)}%</span>
        <button
          className="zb"
          onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
        >
          +
        </button>
      </div>

      {/* Canvas toolbar */}
      <div className="canvas-tools" onClick={(e) => e.stopPropagation()}>
        <button
          className={`ct-btn ${showGrid ? "act" : ""}`}
          onClick={() => setShowGrid((v) => !v)}
        >
          Grid
        </button>
        <button
          className={`ct-btn ${showLabels ? "act" : ""}`}
          onClick={() => setShowLabels((v) => !v)}
        >
          Labels
        </button>
        <div className="ct-sep" />
        {selectedObjId && selectedObj && !selectedObj.locked && (
          <>
            <button
              className="ct-btn"
              onClick={() => onUpdateObj(selectedObjId, { locked: true })}
            >
              Lock
            </button>
            <button
              className="ct-btn"
              style={{ color: "var(--red)" }}
              onClick={() => onDeleteObject(selectedObjId)}
            >
              Delete
            </button>
          </>
        )}
        {selectedObjId && selectedObj?.locked && (
          <button
            className="ct-btn"
            onClick={() => onUpdateObj(selectedObjId, { locked: false })}
          >
            Unlock
          </button>
        )}
        {!selectedObjId && (
          <span style={{ fontSize: 10, color: "var(--txt3)", padding: "0 8px" }}>
            Click objects to select
          </span>
        )}
      </div>
    </div>
  );
}
