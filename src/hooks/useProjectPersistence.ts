import { useCallback, useEffect, useRef } from "react";
import type { Project, ToastType } from "../types";
import {
  clearLocalStorage,
  exportToFile,
  importFromFile,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "../storage";

const AUTOSAVE_DELAY_MS = 1500;

interface UseProjectPersistenceArgs {
  project: Project;
  setProject: (p: Project) => void;
  initialProject: Project;
  toast: (msg: string, type: ToastType) => void;
}

export function useProjectPersistence({
  project,
  setProject,
  initialProject,
  toast,
}: UseProjectPersistenceArgs) {
  const loaded = useRef(false);

  // ── Load on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const saved = loadFromLocalStorage();
    if (saved) {
      setProject(saved);
      toast("Project restored", "inf");
    }
  }, [setProject, toast]);

  // ── Auto-save on changes (debounced) ────────────────────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip the initial render (which is the default or restored project)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveToLocalStorage(project);
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [project]);

  // ── Manual save ─────────────────────────────────────────────────────
  const save = useCallback(() => {
    const ok = saveToLocalStorage(project);
    toast(ok ? "Project saved" : "Save failed — storage full?", ok ? "ok" : "err");
  }, [project, toast]);

  // ── Export to file ──────────────────────────────────────────────────
  const exportProject = useCallback(() => {
    exportToFile(project);
    toast("Exported " + project.name + ".phaser.json", "ok");
  }, [project, toast]);

  // ── Import from file ───────────────────────────────────────────────
  const importProject = useCallback(() => {
    importFromFile()
      .then((p) => {
        setProject(p);
        saveToLocalStorage(p);
        toast(`Loaded "${p.name}"`, "ok");
      })
      .catch((err) => {
        if (err instanceof Error && err.message) {
          toast(err.message, "err");
        }
      });
  }, [setProject, toast]);

  // ── New project ────────────────────────────────────────────────────
  const newProject = useCallback(() => {
    setProject(initialProject);
    clearLocalStorage();
    toast("New project created", "inf");
  }, [setProject, initialProject, toast]);

  return { save, exportProject, importProject, newProject };
}
