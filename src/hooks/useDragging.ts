import { useEffect, useState } from "react";
import type { DragState, GameObject } from "../types";

interface UseDraggingOptions {
  zoom: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onUpdateObj: (objId: string, updates: Partial<GameObject>) => void;
  onSelectObj: (objId: string) => void;
}

export function useDragging({
  zoom,
  onUpdateObj,
  onSelectObj,
}: UseDraggingOptions) {
  const [dragging, setDragging] = useState<DragState | null>(null);

  const handleCanvasMouseDown = (
    e: React.MouseEvent,
    obj: GameObject,
  ) => {
    if (obj.locked) return;
    e.stopPropagation();
    onSelectObj(obj.id);
    setDragging({
      objId: obj.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: obj.x,
      origY: obj.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragging.startX) / zoom;
      const dy = (e.clientY - dragging.startY) / zoom;
      onUpdateObj(dragging.objId, {
        x: Math.round(dragging.origX + dx),
        y: Math.round(dragging.origY + dy),
      });
    };

    const onUp = () => setDragging(null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, zoom, onUpdateObj]);

  return { dragging, handleCanvasMouseDown } as const;
}
