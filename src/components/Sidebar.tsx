import { useState } from "react";
import { OBJ_TYPES } from "../constants";
import type { Module, ProjectItem, Scene } from "../types";

interface SidebarProps {
  scenes: Scene[];
  modules: Module[];
  activeSceneId: string | null;
  selectedObjId: string | null;
  onSelectScene: (id: string) => void;
  onSelectObj: (id: string) => void;
  onToggleVisibility: (objId: string, e?: React.MouseEvent) => void;
  onCreateScene: () => void;
  onCreateModule: () => void;
  onDeleteItem: (item: ProjectItem, e?: React.MouseEvent) => void;
}

export function Sidebar({
  scenes,
  modules,
  activeSceneId,
  selectedObjId,
  onSelectScene,
  onSelectObj,
  onToggleVisibility,
  onCreateScene,
  onCreateModule,
  onDeleteItem,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [scenesOpen, setScenesOpen] = useState(true);
  const [modulesOpen, setModulesOpen] = useState(true);

  const lowerSearch = search.toLowerCase();
  const filteredScenes = scenes.filter(
    (s) => !search || s.name.toLowerCase().includes(lowerSearch),
  );
  const filteredModules = modules.filter(
    (m) => !search || m.name.toLowerCase().includes(lowerSearch),
  );

  return (
    <div className="side">
      <div className="side-hdr">
        <span className="side-t">Explorer</span>
        <div style={{ display: "flex", gap: 2 }}>
          <button className="ib primary" title="New Scene" onClick={onCreateScene}>
            +
          </button>
        </div>
      </div>

      <div className="side-search">
        <input
          placeholder="Filter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="side-body">
        {/* Scenes */}
        <div>
          <div className="sec-hdr" onClick={() => setScenesOpen((o) => !o)}>
            <span
              style={{
                fontSize: 8,
                transition: "transform 0.15s",
                transform: scenesOpen ? "rotate(90deg)" : "",
              }}
            >
              ▶
            </span>
            Scenes
            <span className="sec-cnt">{filteredScenes.length}</span>
          </div>
          {scenesOpen &&
            filteredScenes.map((scene) => (
              <div key={scene.id}>
                <div
                  className={`tree-i ${activeSceneId === scene.id ? "act" : ""}`}
                  onClick={() => onSelectScene(scene.id)}
                >
                  <div
                    className="tree-ic"
                    style={{ color: "var(--blue)", background: "rgba(74,125,255,0.1)" }}
                  >
                    □
                  </div>
                  <span className="tree-nm">{scene.name}</span>
                  <span style={{ fontSize: 10, color: "var(--txt3)" }}>
                    {scene.objects.length}
                  </span>
                  <div className="tree-acts">
                    <button
                      className="ib danger"
                      title="Delete"
                      onClick={(e) => onDeleteItem(scene, e)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                {activeSceneId === scene.id && (
                  <div className="obj-tree">
                    {scene.objects.map((obj) => (
                      <div
                        key={obj.id}
                        className={`obj-item ${selectedObjId === obj.id ? "sel" : ""}`}
                        onClick={() => onSelectObj(obj.id)}
                      >
                        <div
                          className="obj-dot"
                          style={{
                            background: OBJ_TYPES[obj.objType]?.color ?? "#666",
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {obj.name}
                        </span>
                        <span
                          className="obj-vis"
                          onClick={(e) => onToggleVisibility(obj.id, e)}
                        >
                          {obj.visible ? "👁" : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Modules */}
        <div style={{ marginTop: 4 }}>
          <div className="sec-hdr" onClick={() => setModulesOpen((o) => !o)}>
            <span
              style={{
                fontSize: 8,
                transition: "transform 0.15s",
                transform: modulesOpen ? "rotate(90deg)" : "",
              }}
            >
              ▶
            </span>
            Modules
            <span className="sec-cnt">{filteredModules.length}</span>
            <div style={{ flex: 1 }} />
            <button
              className="ib primary"
              title="New Module"
              style={{ marginRight: -4 }}
              onClick={(e) => {
                e.stopPropagation();
                onCreateModule();
              }}
            >
              +
            </button>
          </div>
          {modulesOpen &&
            filteredModules.map((mod) => (
              <div key={mod.id} className="tree-i" onClick={() => { /* select module */ }}>
                <div
                  className="tree-ic"
                  style={{ color: "var(--purple)", background: "rgba(167,139,250,0.1)" }}
                >
                  ◈
                </div>
                <span className="tree-nm">{mod.name}</span>
                <div className="tree-acts">
                  <button
                    className="ib danger"
                    title="Delete"
                    onClick={(e) => onDeleteItem(mod, e)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
