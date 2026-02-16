import { OBJ_TYPES } from "../constants";
import type {
  GameObject,
  Project,
  ProjectConfig,
  RightTab,
  Scene,
} from "../types";

interface RightPanelProps {
  rightTab: RightTab;
  onSetRightTab: (tab: RightTab) => void;
  selectedObj: GameObject | undefined;
  activeScene: Scene | undefined;
  project: Project;
  onUpdateObj: (objId: string, updates: Partial<GameObject>) => void;
  onUpdateObjProp: (objId: string, key: string, val: string | number | boolean) => void;
  onDeleteObject: (objId: string) => void;
  onSelectObj: (id: string) => void;
  onUpdateSceneName: (name: string) => void;
  onUpdateSceneDescription: (desc: string) => void;
}

export function RightPanel({
  rightTab,
  onSetRightTab,
  selectedObj,
  activeScene,
  project,
  onUpdateObj,
  onUpdateObjProp,
  onDeleteObject,
  onSelectObj,
  onUpdateSceneName,
  onUpdateSceneDescription,
}: RightPanelProps) {
  const totalObj = project.scenes.reduce((s, sc) => s + sc.objects.length, 0);
  const allItems = [...project.scenes, ...project.modules];
  const totalCodeLines = allItems.reduce(
    (s, i) => s + (i.code?.split("\n").length ?? 0),
    0,
  );

  return (
    <div className="right">
      <div className="rt-tabs">
        <div
          className={`rt-tab ${rightTab === "props" ? "act" : ""}`}
          onClick={() => onSetRightTab("props")}
        >
          Properties
        </div>
        <div
          className={`rt-tab ${rightTab === "insights" ? "act" : ""}`}
          onClick={() => onSetRightTab("insights")}
        >
          Insights
        </div>
      </div>

      <div className="rt-body">
        {rightTab === "props" && <PropertiesTab
          selectedObj={selectedObj}
          activeScene={activeScene}
          config={project.config}
          onUpdateObj={onUpdateObj}
          onUpdateObjProp={onUpdateObjProp}
          onDeleteObject={onDeleteObject}
          onSelectObj={onSelectObj}
          onUpdateSceneName={onUpdateSceneName}
          onUpdateSceneDescription={onUpdateSceneDescription}
        />}
        {rightTab === "insights" && <InsightsTab
          project={project}
          activeScene={activeScene}
          totalObj={totalObj}
          totalCodeLines={totalCodeLines}
        />}
      </div>
    </div>
  );
}

// ── Properties Tab ──────────────────────────────────────────────────────

interface PropertiesTabProps {
  selectedObj: GameObject | undefined;
  activeScene: Scene | undefined;
  config: ProjectConfig;
  onUpdateObj: (objId: string, updates: Partial<GameObject>) => void;
  onUpdateObjProp: (objId: string, key: string, val: string | number | boolean) => void;
  onDeleteObject: (objId: string) => void;
  onSelectObj: (id: string) => void;
  onUpdateSceneName: (name: string) => void;
  onUpdateSceneDescription: (desc: string) => void;
}

function PropertiesTab({
  selectedObj,
  activeScene,
  onUpdateObj,
  onUpdateObjProp,
  onDeleteObject,
  onSelectObj,
  onUpdateSceneName,
  onUpdateSceneDescription,
}: PropertiesTabProps) {
  if (selectedObj) {
    return <ObjectProperties
      obj={selectedObj}
      onUpdateObj={onUpdateObj}
      onUpdateObjProp={onUpdateObjProp}
      onDeleteObject={onDeleteObject}
    />;
  }

  if (activeScene) {
    return <SceneProperties
      scene={activeScene}
      onSelectObj={onSelectObj}
      onUpdateName={onUpdateSceneName}
      onUpdateDescription={onUpdateSceneDescription}
    />;
  }

  return (
    <div className="empty" style={{ padding: "40px 0" }}>
      <p style={{ fontSize: 11 }}>Select a scene or object</p>
    </div>
  );
}

// ── Object Properties ───────────────────────────────────────────────────

interface ObjectPropertiesProps {
  obj: GameObject;
  onUpdateObj: (objId: string, updates: Partial<GameObject>) => void;
  onUpdateObjProp: (objId: string, key: string, val: string | number | boolean) => void;
  onDeleteObject: (objId: string) => void;
}

function ObjectProperties({
  obj,
  onUpdateObj,
  onUpdateObjProp,
  onDeleteObject,
}: ObjectPropertiesProps) {
  const typeMeta = OBJ_TYPES[obj.objType];

  return (
    <>
      {/* Identity */}
      <div className="pg">
        <div className="pg-t">Object</div>
        <div className="pr">
          <span className="pr-l">Name</span>
          <input
            className="pr-v"
            value={obj.name}
            onChange={(e) => onUpdateObj(obj.id, { name: e.target.value })}
          />
        </div>
        <div className="pr">
          <span className="pr-l">Type</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <span
              className="type-chip"
              style={{
                background: (typeMeta?.color ?? "#666") + "20",
                color: typeMeta?.color ?? "#666",
              }}
            >
              {typeMeta?.icon} {typeMeta?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Transform */}
      <div className="pg">
        <div className="pg-t">Transform</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {(["x", "y", "w", "h"] as const).map((k) => (
            <div className="pr" key={k} style={{ margin: 0 }}>
              <span className="pr-l" style={{ width: 20 }}>
                {k.toUpperCase()}
              </span>
              <input
                className="pr-v"
                type="number"
                value={Math.round(obj[k])}
                onChange={(e) =>
                  onUpdateObj(obj.id, { [k]: +e.target.value })
                }
                disabled={obj.locked}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="pg">
        <div className="pg-t">Appearance</div>
        <div className="pr">
          <span className="pr-l">Color</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flex: 1 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: obj.color,
                border: "1px solid var(--bdr)",
                cursor: "pointer",
              }}
              onClick={() => {
                const el = document.createElement("input");
                el.type = "color";
                el.value = obj.color;
                el.addEventListener("input", (ev) =>
                  onUpdateObj(obj.id, { color: (ev.target as HTMLInputElement).value }),
                );
                el.click();
              }}
            />
            <input
              className="pr-v"
              value={obj.color}
              onChange={(e) => onUpdateObj(obj.id, { color: e.target.value })}
            />
          </div>
        </div>
        <div className="pr">
          <span className="pr-l">Visible</span>
          <span
            style={{
              cursor: "pointer",
              color: obj.visible ? "var(--green)" : "var(--red)",
            }}
            onClick={() => onUpdateObj(obj.id, { visible: !obj.visible })}
          >
            {obj.visible ? "✓ Yes" : "✗ No"}
          </span>
        </div>
        <div className="pr">
          <span className="pr-l">Locked</span>
          <span
            style={{
              cursor: "pointer",
              color: obj.locked ? "var(--amber)" : "var(--txt3)",
            }}
            onClick={() => onUpdateObj(obj.id, { locked: !obj.locked })}
          >
            {obj.locked ? "🔒 Yes" : "🔓 No"}
          </span>
        </div>
      </div>

      {/* Custom props */}
      <div className="pg">
        <div className="pg-t">Custom Properties</div>
        {Object.entries(obj.props).map(([key, val]) => (
          <div className="pr" key={key}>
            <span className="pr-l" style={{ fontSize: 10.5 }}>
              {key}
            </span>
            <input
              className="pr-v"
              value={String(val)}
              onChange={(e) => onUpdateObjProp(obj.id, key, e.target.value)}
            />
          </div>
        ))}
        {Object.keys(obj.props).length === 0 && (
          <span style={{ fontSize: 11, color: "var(--txt3)", fontStyle: "italic" }}>
            No custom props
          </span>
        )}
        <button
          className="btn"
          style={{ marginTop: 6, fontSize: 10.5, padding: "3px 8px" }}
          onClick={() => {
            const key = prompt("Property name:");
            if (key) onUpdateObjProp(obj.id, key, "");
          }}
        >
          + Add Property
        </button>
      </div>

      {/* Danger zone */}
      <div className="pg">
        <button
          className="btn dng"
          style={{ width: "100%", fontSize: 11 }}
          onClick={() => onDeleteObject(obj.id)}
        >
          Delete Object
        </button>
      </div>
    </>
  );
}

// ── Scene Properties ────────────────────────────────────────────────────

interface ScenePropertiesProps {
  scene: Scene;
  onSelectObj: (id: string) => void;
  onUpdateName: (name: string) => void;
  onUpdateDescription: (desc: string) => void;
}

function SceneProperties({
  scene,
  onSelectObj,
  onUpdateName,
  onUpdateDescription,
}: ScenePropertiesProps) {
  return (
    <>
      <div className="pg">
        <div className="pg-t">Scene</div>
        <div className="pr">
          <span className="pr-l">Name</span>
          <input
            className="pr-v"
            value={scene.name}
            onChange={(e) => onUpdateName(e.target.value)}
          />
        </div>
        <div className="pr" style={{ alignItems: "flex-start" }}>
          <span className="pr-l" style={{ marginTop: 4 }}>
            Desc
          </span>
          <textarea
            className="pr-v"
            style={{
              resize: "vertical",
              minHeight: 40,
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.4,
            }}
            value={scene.description}
            onChange={(e) => onUpdateDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="pg">
        <div className="pg-t">Objects ({scene.objects.length})</div>
        {scene.objects.map((obj) => (
          <div
            key={obj.id}
            className="obj-item"
            style={{ padding: "4px 0", cursor: "pointer" }}
            onClick={() => onSelectObj(obj.id)}
          >
            <div
              className="obj-dot"
              style={{ background: OBJ_TYPES[obj.objType]?.color }}
            />
            <span style={{ flex: 1 }}>{obj.name}</span>
            <span style={{ fontSize: 10, color: "var(--txt3)" }}>
              {OBJ_TYPES[obj.objType]?.label}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Insights Tab ────────────────────────────────────────────────────────

interface InsightsTabProps {
  project: Project;
  activeScene: Scene | undefined;
  totalObj: number;
  totalCodeLines: number;
}

function InsightsTab({
  project,
  activeScene,
  totalObj,
  totalCodeLines,
}: InsightsTabProps) {
  const objTypeCounts = project.scenes.reduce<Record<string, number>>(
    (acc, sc) => {
      sc.objects.forEach((o) => {
        acc[o.objType] = (acc[o.objType] ?? 0) + 1;
      });
      return acc;
    },
    {},
  );

  return (
    <>
      {/* Project overview */}
      <div className="icard">
        <div className="icard-t">Project</div>
        <div className="mgrid">
          <div>
            <div className="mv" style={{ color: "var(--blue)" }}>
              {project.scenes.length}
            </div>
            <div className="ml">Scenes</div>
          </div>
          <div>
            <div className="mv" style={{ color: "var(--purple)" }}>
              {project.modules.length}
            </div>
            <div className="ml">Modules</div>
          </div>
          <div>
            <div className="mv" style={{ color: "var(--green)" }}>
              {totalObj}
            </div>
            <div className="ml">Objects</div>
          </div>
          <div>
            <div className="mv" style={{ color: "var(--amber)" }}>
              {totalCodeLines}
            </div>
            <div className="ml">Code Lines</div>
          </div>
        </div>
      </div>

      {/* Objects per scene */}
      <div className="icard">
        <div className="icard-t">Objects Per Scene</div>
        {project.scenes.map((sc) => (
          <div key={sc.id} style={{ marginBottom: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 2,
              }}
            >
              <span style={{ color: "var(--txt2)" }}>{sc.name}</span>
              <span style={{ color: "var(--blue)" }}>{sc.objects.length}</span>
            </div>
            <div className="cbar">
              <div
                className="cfill"
                style={{
                  width: `${totalObj ? (sc.objects.length / totalObj) * 100 : 0}%`,
                  background: "var(--blue)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Object type distribution */}
      <div className="icard">
        <div className="icard-t">Object Type Distribution</div>
        {Object.entries(objTypeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <div
              key={type}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: OBJ_TYPES[type]?.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--txt2)",
                  flex: 1,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {OBJ_TYPES[type]?.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--txt3)",
                }}
              >
                {count}
              </span>
            </div>
          ))}
      </div>

      {/* Active scene layout minimap */}
      {activeScene && (
        <div className="icard">
          <div className="icard-t">{activeScene.name} — Layout</div>
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: `${(project.config.height / project.config.width) * 100}%`,
              background: project.config.backgroundColor,
              borderRadius: "var(--rad)",
              overflow: "hidden",
              border: "1px solid var(--bdr)",
            }}
          >
            {activeScene.objects
              .filter((o) => o.visible)
              .map((obj) => (
                <div
                  key={obj.id}
                  style={{
                    position: "absolute",
                    left: `${((obj.x - obj.w / 2) / project.config.width) * 100}%`,
                    top: `${((obj.y - obj.h / 2) / project.config.height) * 100}%`,
                    width: `${(obj.w / project.config.width) * 100}%`,
                    height: `${(obj.h / project.config.height) * 100}%`,
                    background:
                      obj.objType === "zone" ? "transparent" : obj.color,
                    border:
                      obj.objType === "zone"
                        ? `1px dashed ${obj.color}40`
                        : "none",
                    borderRadius: obj.objType === "circle" ? "50%" : 1,
                    opacity: 0.7,
                  }}
                  title={obj.name}
                />
              ))}
          </div>
        </div>
      )}
    </>
  );
}
