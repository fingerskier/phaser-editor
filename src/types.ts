// ── Object type metadata ────────────────────────────────────────────────
export interface ObjTypeMeta {
  label: string;
  color: string;
  icon: string;
}

// ── Game object within a scene ──────────────────────────────────────────
export interface GameObject {
  id: string;
  name: string;
  objType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  visible: boolean;
  locked: boolean;
  props: Record<string, string | number | boolean>;
}

// ── Scene ───────────────────────────────────────────────────────────────
export interface Scene {
  id: string;
  name: string;
  type: "scene";
  description: string;
  objects: GameObject[];
  code: string;
}

// ── Module ──────────────────────────────────────────────────────────────
export interface Module {
  id: string;
  name: string;
  type: "module";
  description: string;
  code: string;
}

export type ProjectItem = Scene | Module;

// ── Project configuration ───────────────────────────────────────────────
export interface ProjectConfig {
  width: number;
  height: number;
  physics: string;
  pixelArt: boolean;
  backgroundColor: string;
}

// ── Top-level project ───────────────────────────────────────────────────
export interface Project {
  name: string;
  config: ProjectConfig;
  scenes: Scene[];
  modules: Module[];
}

// ── Modal state ─────────────────────────────────────────────────────────
export type ModalState =
  | { action: "create-scene" }
  | { action: "create-module" }
  | { action: "delete"; item: ProjectItem }
  | null;

export interface ModalFormData {
  name?: string;
  description?: string;
}

// ── Toast ───────────────────────────────────────────────────────────────
export type ToastType = "ok" | "err" | "inf";

export interface Toast {
  id: string;
  msg: string;
  type: ToastType;
}

// ── Drag state ──────────────────────────────────────────────────────────
export interface DragState {
  objId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

// ── View mode ───────────────────────────────────────────────────────────
export type ViewMode = "canvas" | "code";
export type RightTab = "props" | "insights";
