import type { ProjectConfig } from "../types";

interface TopbarProps {
  projectName: string;
  config: ProjectConfig;
}

export function Topbar({ projectName, config }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="logo">
        ⬡ PHASER<span>.STUDIO</span>
      </div>
      <div className="proj">{projectName}</div>
      <div className="spacer" />
      <div className="cfg">
        <span className="cfg-b">
          {config.width}×{config.height}
        </span>
        <span className="cfg-b">{config.physics}</span>
        <span className="cfg-b">{config.pixelArt ? "pixel" : "smooth"}</span>
      </div>
    </div>
  );
}
