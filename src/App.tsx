import { useCallback, useState } from "react";
import { Canvas } from "./components/Canvas";
import { CodeEditor } from "./components/CodeEditor";
import { Modal } from "./components/Modal";
import { RightPanel } from "./components/RightPanel";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { Toasts } from "./components/Toasts";
import { Topbar } from "./components/Topbar";
import { ViewBar } from "./components/ViewBar";
import { OBJ_TYPES, INITIAL_PROJECT } from "./constants";
import { useToast } from "./hooks/useToast";
import type {
  GameObject,
  ModalFormData,
  ModalState,
  Project,
  ProjectItem,
  RightTab,
  ViewMode,
} from "./types";
import { uid } from "./utils";

export default function App() {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [activeSceneId, setActiveSceneId] = useState<string | null>("scene-2");
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [rightTab, setRightTab] = useState<RightTab>("props");
  const [modal, setModal] = useState<ModalState>(null);
  const [modalData, setModalData] = useState<ModalFormData>({});

  const { toasts, toast } = useToast();

  const activeScene = project.scenes.find((s) => s.id === activeSceneId);
  const selectedObj = activeScene?.objects.find((o) => o.id === selectedObjId);

  // ── Scene / Module CRUD ───────────────────────────────────────────────

  const createScene = () => {
    setModal({ action: "create-scene" });
    setModalData({ name: "", description: "" });
  };

  const createModule = () => {
    setModal({ action: "create-module" });
    setModalData({ name: "", description: "" });
  };

  const deleteItem = (item: ProjectItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setModal({ action: "delete", item });
  };

  const doCreate = () => {
    if (!modalData.name?.trim()) return;
    const name = modalData.name.trim();

    if (modal?.action === "create-scene") {
      const ns = {
        id: uid(),
        name,
        type: "scene" as const,
        description: modalData.description ?? "",
        objects: [],
        code: `class ${name} extends Phaser.Scene {\n  constructor() { super({ key: '${name}' }); }\n  preload() {}\n  create() {}\n  update() {}\n}`,
      };
      setProject((p) => ({ ...p, scenes: [...p.scenes, ns] }));
      setActiveSceneId(ns.id);
      toast(`Created scene "${name}"`, "ok");
    } else {
      const nm = {
        id: uid(),
        name,
        type: "module" as const,
        description: modalData.description ?? "",
        code: `export default class ${name} {\n  constructor(scene) { this.scene = scene; }\n  update() {}\n  destroy() {}\n}`,
      };
      setProject((p) => ({ ...p, modules: [...p.modules, nm] }));
      toast(`Created module "${name}"`, "ok");
    }
    setModal(null);
  };

  const doDelete = () => {
    if (!modal || modal.action !== "delete") return;
    const { item } = modal;

    if (item.type === "scene") {
      setProject((p) => ({
        ...p,
        scenes: p.scenes.filter((s) => s.id !== item.id),
      }));
      if (activeSceneId === item.id) {
        setActiveSceneId(project.scenes[0]?.id ?? null);
      }
    } else {
      setProject((p) => ({
        ...p,
        modules: p.modules.filter((m) => m.id !== item.id),
      }));
    }
    setModal(null);
    toast(`Deleted "${item.name}"`, "err");
  };

  // ── Object CRUD ───────────────────────────────────────────────────────

  const addObject = (objType: string) => {
    if (!activeScene) return;
    const cfg = OBJ_TYPES[objType];
    if (!cfg) return;

    const newObj: GameObject = {
      id: uid(),
      name: `${objType}${activeScene.objects.length + 1}`,
      objType,
      x: 400 + Math.random() * 40 - 20,
      y: 300 + Math.random() * 40 - 20,
      w: objType === "text" || objType === "zone" ? 80 : 40,
      h: objType === "text" ? 24 : objType === "zone" ? 80 : 40,
      color: cfg.color,
      visible: true,
      locked: false,
      props: {},
    };

    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId
          ? { ...s, objects: [...s.objects, newObj] }
          : s,
      ),
    }));
    setSelectedObjId(newObj.id);
    toast(`Added ${cfg.label}`, "ok");
  };

  const deleteObject = (objId: string) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId
          ? { ...s, objects: s.objects.filter((o) => o.id !== objId) }
          : s,
      ),
    }));
    if (selectedObjId === objId) setSelectedObjId(null);
    toast("Object removed", "err");
  };

  const updateObj = useCallback(
    (objId: string, updates: Partial<GameObject>) => {
      setProject((p) => ({
        ...p,
        scenes: p.scenes.map((s) =>
          s.id === activeSceneId
            ? {
                ...s,
                objects: s.objects.map((o) =>
                  o.id === objId ? { ...o, ...updates } : o,
                ),
              }
            : s,
        ),
      }));
    },
    [activeSceneId],
  );

  const updateObjProp = (
    objId: string,
    key: string,
    val: string | number | boolean,
  ) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId
          ? {
              ...s,
              objects: s.objects.map((o) =>
                o.id === objId
                  ? { ...o, props: { ...o.props, [key]: val } }
                  : o,
              ),
            }
          : s,
      ),
    }));
  };

  const toggleVisibility = (objId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const obj = activeScene?.objects.find((o) => o.id === objId);
    if (obj) updateObj(objId, { visible: !obj.visible });
  };

  // ── Code edit ─────────────────────────────────────────────────────────

  const updateSceneCode = (code: string) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId ? { ...s, code } : s,
      ),
    }));
  };

  // ── Scene property updates ────────────────────────────────────────────

  const updateSceneName = (name: string) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId ? { ...s, name } : s,
      ),
    }));
  };

  const updateSceneDescription = (description: string) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId ? { ...s, description } : s,
      ),
    }));
  };

  // ── Select scene ──────────────────────────────────────────────────────

  const selectScene = (id: string) => {
    setActiveSceneId(id);
    setSelectedObjId(null);
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="root">
      <Topbar projectName={project.name} config={project.config} />

      <div className="layout">
        <Sidebar
          scenes={project.scenes}
          modules={project.modules}
          activeSceneId={activeSceneId}
          selectedObjId={selectedObjId}
          onSelectScene={selectScene}
          onSelectObj={setSelectedObjId}
          onToggleVisibility={toggleVisibility}
          onCreateScene={createScene}
          onCreateModule={createModule}
          onDeleteItem={deleteItem}
        />

        <div className="center">
          <ViewBar
            viewMode={viewMode}
            activeScene={activeScene}
            onSetViewMode={setViewMode}
            onAddObject={addObject}
          />

          {viewMode === "canvas" && activeScene ? (
            <Canvas
              scene={activeScene}
              config={project.config}
              selectedObjId={selectedObjId}
              selectedObj={selectedObj}
              onSelectObj={setSelectedObjId}
              onUpdateObj={updateObj}
              onDeleteObject={deleteObject}
            />
          ) : viewMode === "code" && activeScene ? (
            <CodeEditor
              code={activeScene.code}
              onChange={updateSceneCode}
            />
          ) : (
            <div className="empty">
              <p>Select a scene from the sidebar</p>
              <small>Or create a new one</small>
            </div>
          )}
        </div>

        <RightPanel
          rightTab={rightTab}
          onSetRightTab={setRightTab}
          selectedObj={selectedObj}
          activeScene={activeScene}
          project={project}
          onUpdateObj={updateObj}
          onUpdateObjProp={updateObjProp}
          onDeleteObject={deleteObject}
          onSelectObj={setSelectedObjId}
          onUpdateSceneName={updateSceneName}
          onUpdateSceneDescription={updateSceneDescription}
        />
      </div>

      <StatusBar activeScene={activeScene} />

      <Modal
        modal={modal}
        modalData={modalData}
        onClose={() => setModal(null)}
        onSetModalData={setModalData}
        onDoCreate={doCreate}
        onDoDelete={doDelete}
      />

      <Toasts toasts={toasts} />
    </div>
  );
}
