import type { Project, SaveFile } from "./types";
import { SAVE_FORMAT_VERSION } from "./types";

const STORAGE_KEY = "phaser-studio-project";

// ── Validation ──────────────────────────────────────────────────────────

export function validateSaveFile(data: unknown): SaveFile | null {
  if (
    typeof data !== "object" ||
    data === null ||
    !("version" in data) ||
    !("savedAt" in data) ||
    !("project" in data)
  )
    return null;

  const sf = data as SaveFile;
  if (typeof sf.version !== "number") return null;
  if (typeof sf.savedAt !== "string") return null;

  const p = sf.project;
  if (typeof p !== "object" || p === null) return null;
  if (typeof p.name !== "string") return null;
  if (!Array.isArray(p.scenes)) return null;
  if (!Array.isArray(p.modules)) return null;
  if (typeof p.config !== "object" || p.config === null) return null;

  return sf;
}

// ── Migration ───────────────────────────────────────────────────────────

export function migrateSaveFile(sf: SaveFile): SaveFile {
  if (sf.version > SAVE_FORMAT_VERSION) {
    throw new Error(
      `Save file is version ${sf.version}, but this editor only supports up to version ${SAVE_FORMAT_VERSION}.`,
    );
  }
  // v1 → passthrough (future migrations chain here)
  return sf;
}

// ── LocalStorage ────────────────────────────────────────────────────────

function makeSaveFile(project: Project): SaveFile {
  return {
    version: SAVE_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    project,
  };
}

export function saveToLocalStorage(project: Project): boolean {
  try {
    const json = JSON.stringify(makeSaveFile(project));
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch {
    return false;
  }
}

export function loadFromLocalStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const sf = validateSaveFile(parsed);
    if (!sf) return null;

    const migrated = migrateSaveFile(sf);
    return migrated.project;
  } catch {
    return null;
  }
}

export function hasSavedProject(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ── File export ─────────────────────────────────────────────────────────

export function exportToFile(project: Project): void {
  const sf = makeSaveFile(project);
  const json = JSON.stringify(sf, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name}.phaser.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── File import ─────────────────────────────────────────────────────────

export function importFromFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return; // user cancelled

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          const sf = validateSaveFile(parsed);
          if (!sf) {
            reject(new Error("Invalid save file format"));
            return;
          }
          const migrated = migrateSaveFile(sf);
          resolve(migrated.project);
        } catch (err) {
          reject(
            err instanceof Error ? err : new Error("Failed to parse file"),
          );
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });

    input.click();
  });
}
