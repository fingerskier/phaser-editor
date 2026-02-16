import type { Scene } from "../types";

interface StatusBarProps {
  activeScene: Scene | undefined;
}

export function StatusBar({ activeScene }: StatusBarProps) {
  return (
    <div className="sbar">
      <span className="sbar-dot" />
      <span>Ready</span>
      <div className="spacer" />
      <span>
        {activeScene
          ? `${activeScene.name} — ${activeScene.objects.length} objects`
          : "No scene"}
      </span>
      <span>Phaser 3</span>
    </div>
  );
}
