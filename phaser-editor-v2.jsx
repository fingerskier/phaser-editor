import { useState, useCallback, useRef, useEffect } from "react";

// ── Generate unique IDs ─────────────────────────────────────────────────
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── Game Object Types ───────────────────────────────────────────────────
const OBJ_TYPES = {
  sprite: { label: "Sprite", color: "#4a7dff", icon: "◆" },
  text: { label: "Text", color: "#34d399", icon: "T" },
  rectangle: { label: "Rectangle", color: "#f59e0b", icon: "▬" },
  circle: { label: "Circle", color: "#a78bfa", icon: "●" },
  image: { label: "Image", color: "#22d3ee", icon: "▣" },
  tilemap: { label: "Tilemap", color: "#f472b6", icon: "▦" },
  group: { label: "Group", color: "#fb923c", icon: "◈" },
  particles: { label: "Particles", color: "#e879f9", icon: "✦" },
  zone: { label: "Zone", color: "#94a3b8", icon: "⬚" },
};

// ── Initial project data ────────────────────────────────────────────────
const INITIAL_PROJECT = {
  name: "my-phaser-game",
  config: { width: 800, height: 600, physics: "arcade", pixelArt: true, backgroundColor: "#1a1a2e" },
  scenes: [
    {
      id: "scene-1", name: "BootScene", type: "scene",
      description: "Preloads assets and shows loading bar",
      objects: [
        { id: "obj-1a", name: "loadingBg", objType: "rectangle", x: 300, y: 300, w: 320, h: 30, color: "#333333", visible: true, locked: false, props: { fillColor: "0x333333" } },
        { id: "obj-1b", name: "loadingBar", objType: "rectangle", x: 300, y: 300, w: 280, h: 22, color: "#4a7dff", visible: true, locked: false, props: { fillColor: "0x4a7dff" } },
        { id: "obj-1c", name: "loadingText", objType: "text", x: 400, y: 260, w: 120, h: 24, color: "#34d399", visible: true, locked: false, props: { text: "Loading...", fontSize: "16px", fontFamily: "monospace" } },
      ],
      code: `class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }
  preload() {
    this.load.image('logo', 'assets/logo.png');
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 48 });
    this.load.tilemapTiledJSON('level1', 'assets/level1.json');
  }
  create() { this.scene.start('GameScene'); }
}`,
    },
    {
      id: "scene-2", name: "GameScene", type: "scene",
      description: "Main gameplay with physics and input",
      objects: [
        { id: "obj-2a", name: "sky", objType: "image", x: 400, y: 300, w: 800, h: 600, color: "#1a1a4e", visible: true, locked: true, props: { key: "sky", depth: 0 } },
        { id: "obj-2b", name: "ground", objType: "tilemap", x: 400, y: 568, w: 800, h: 64, color: "#4a3728", visible: true, locked: true, props: { key: "level1", layer: "Ground" } },
        { id: "obj-2c", name: "player", objType: "sprite", x: 100, y: 420, w: 32, h: 48, color: "#4a7dff", visible: true, locked: false, props: { key: "player", bounce: 0.1, collideWorld: true, gravity: 300 } },
        { id: "obj-2d", name: "enemy1", objType: "sprite", x: 450, y: 420, w: 32, h: 32, color: "#ef4444", visible: true, locked: false, props: { key: "slime", pattern: "patrol", speed: 80 } },
        { id: "obj-2e", name: "enemy2", objType: "sprite", x: 620, y: 420, w: 32, h: 32, color: "#ef4444", visible: true, locked: false, props: { key: "slime", pattern: "patrol", speed: 80 } },
        { id: "obj-2f", name: "coin1", objType: "sprite", x: 260, y: 340, w: 16, h: 16, color: "#f59e0b", visible: true, locked: false, props: { key: "coin", animated: true } },
        { id: "obj-2g", name: "coin2", objType: "sprite", x: 380, y: 280, w: 16, h: 16, color: "#f59e0b", visible: true, locked: false, props: { key: "coin", animated: true } },
        { id: "obj-2h", name: "coin3", objType: "sprite", x: 540, y: 340, w: 16, h: 16, color: "#f59e0b", visible: true, locked: false, props: { key: "coin", animated: true } },
        { id: "obj-2i", name: "platform1", objType: "rectangle", x: 350, y: 380, w: 120, h: 16, color: "#6b5b3e", visible: true, locked: false, props: { isStatic: true } },
        { id: "obj-2j", name: "platform2", objType: "rectangle", x: 550, y: 310, w: 100, h: 16, color: "#6b5b3e", visible: true, locked: false, props: { isStatic: true } },
        { id: "obj-2k", name: "spawnZone", objType: "zone", x: 100, y: 300, w: 60, h: 200, color: "#94a3b8", visible: true, locked: false, props: { purpose: "player_spawn" } },
      ],
      code: `class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); this.player = null; this.cursors = null; this.score = 0; }
  create() {
    const map = this.make.tilemap({ key: 'level1' });
    const tileset = map.addTilesetImage('tiles', 'tileset');
    const ground = map.createLayer('Ground', tileset);
    ground.setCollisionByExclusion([-1]);
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, ground);
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  update() {
    if (this.cursors.left.isDown) { this.player.setVelocityX(-160); this.player.flipX = true; }
    else if (this.cursors.right.isDown) { this.player.setVelocityX(160); this.player.flipX = false; }
    else { this.player.setVelocityX(0); }
    if (this.cursors.up.isDown && this.player.body.onFloor()) { this.player.setVelocityY(-330); }
  }
}`,
    },
    {
      id: "scene-3", name: "UIScene", type: "scene",
      description: "HUD overlay for score and health",
      objects: [
        { id: "obj-3a", name: "scoreLabel", objType: "text", x: 16, y: 16, w: 100, h: 20, color: "#34d399", visible: true, locked: false, props: { text: "Score: 0", fontSize: "18px", fontFamily: "monospace", stroke: "#000", strokeThickness: 3 } },
        { id: "obj-3b", name: "healthBarBg", objType: "rectangle", x: 700, y: 30, w: 104, h: 14, color: "#333333", visible: true, locked: false, props: {} },
        { id: "obj-3c", name: "healthBar", objType: "rectangle", x: 700, y: 30, w: 100, h: 10, color: "#34d399", visible: true, locked: false, props: {} },
        { id: "obj-3d", name: "livesIcon1", objType: "sprite", x: 16, y: 50, w: 16, h: 16, color: "#ef4444", visible: true, locked: false, props: { key: "heart" } },
        { id: "obj-3e", name: "livesIcon2", objType: "sprite", x: 38, y: 50, w: 16, h: 16, color: "#ef4444", visible: true, locked: false, props: { key: "heart" } },
        { id: "obj-3f", name: "livesIcon3", objType: "sprite", x: 60, y: 50, w: 16, h: 16, color: "#ef4444", visible: true, locked: false, props: { key: "heart" } },
      ],
      code: `class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }
  create() {
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '18px', fontFamily: 'monospace', color: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.add.rectangle(700, 30, 104, 14, 0x333333);
    this.healthBar = this.add.rectangle(700, 30, 100, 10, 0x00ff88);
  }
}`,
    },
  ],
  modules: [
    { id: "mod-1", name: "PlayerController", type: "module", description: "Player movement and animation", code: `export default class PlayerController {\n  constructor(scene, sprite) { this.scene = scene; this.sprite = sprite; this.speed = 160; }\n  update(cursors) { /* movement logic */ }\n}` },
    { id: "mod-2", name: "EnemyFactory", type: "module", description: "Enemy spawning and AI patterns", code: `export default class EnemyFactory {\n  constructor(scene) { this.scene = scene; this.enemies = scene.physics.add.group(); }\n  spawn(x, y, type) { return this.enemies.create(x, y, type); }\n  update() { /* patrol logic */ }\n}` },
    { id: "mod-3", name: "AudioManager", type: "module", description: "Sound playback and pooling", code: `export default class AudioManager {\n  constructor(scene) { this.scene = scene; this.sounds = new Map(); }\n  play(key) { this.sounds.get(key)?.sound.play(); }\n}` },
  ],
};

// ── Syntax highlighter ──────────────────────────────────────────────────
function highlightJS(code) {
  return code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(\/\/.*)/g, '<span style="color:#546e7a;font-style:italic">$1</span>')
    .replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, '<span style="color:#c3e88d">$1</span>')
    .replace(/\b(class|extends|constructor|super|new|import|export|default|from|const|let|var|function|return|if|else|for|while|typeof|null|undefined|true|false|this)\b/g, '<span style="color:#c792ea">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');
}

// ── CSS ─────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
:root {
  --bg-base:#0b0d12; --bg-srf:#11141b; --bg-elev:#181c26; --bg-hov:#1f2536; --bg-act:#262d3e;
  --bdr:#252b3a; --bdr-f:#4a7dff; --txt:#e4e7f0; --txt2:#8890a4; --txt3:#4e5670;
  --blue:#4a7dff; --green:#34d399; --amber:#f59e0b; --red:#ef4444; --purple:#a78bfa; --cyan:#22d3ee; --pink:#f472b6;
  --rad:5px; --rad-lg:8px; --tr:0.12s ease;
}
*{margin:0;padding:0;box-sizing:border-box}
.root{font-family:'DM Sans',sans-serif;background:var(--bg-base);color:var(--txt);height:100vh;display:flex;flex-direction:column;overflow:hidden;font-size:13px;-webkit-font-smoothing:antialiased}

/* Topbar */
.topbar{height:40px;background:var(--bg-srf);border-bottom:1px solid var(--bdr);display:flex;align-items:center;padding:0 12px;gap:10px;flex-shrink:0}
.logo{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:13px;color:var(--blue);display:flex;align-items:center;gap:6px;user-select:none}
.logo span{color:var(--txt3);font-weight:400}
.proj{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--txt2);background:var(--bg-elev);padding:2px 10px;border-radius:var(--rad);border:1px solid var(--bdr)}
.spacer{flex:1}
.cfg{display:flex;gap:6px;font-size:10.5px;font-family:'JetBrains Mono',monospace}
.cfg-b{padding:2px 7px;border-radius:3px;background:var(--bg-elev);border:1px solid var(--bdr);color:var(--txt2)}

/* Layout */
.layout{flex:1;display:flex;overflow:hidden}

/* Sidebar */
.side{width:250px;background:var(--bg-srf);border-right:1px solid var(--bdr);display:flex;flex-direction:column;flex-shrink:0}
.side-hdr{padding:8px 10px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--bdr)}
.side-t{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--txt3)}
.side-search{padding:6px 10px;border-bottom:1px solid var(--bdr)}
.side-search input{width:100%;background:var(--bg-elev);border:1px solid var(--bdr);border-radius:var(--rad);padding:5px 8px;color:var(--txt);font-size:11.5px;outline:none;font-family:'DM Sans',sans-serif}
.side-search input:focus{border-color:var(--bdr-f)}
.side-body{flex:1;overflow-y:auto;padding:4px 0}
.side-body::-webkit-scrollbar{width:3px}
.side-body::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}

/* Tree */
.sec-hdr{display:flex;align-items:center;gap:5px;padding:5px 10px;cursor:pointer;user-select:none;color:var(--txt2);font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.sec-hdr:hover{color:var(--txt)}
.sec-cnt{font-size:10px;color:var(--txt3);font-weight:400;margin-left:auto}
.tree-i{display:flex;align-items:center;gap:7px;padding:4px 10px 4px 24px;cursor:pointer;transition:background var(--tr);user-select:none;position:relative}
.tree-i:hover{background:var(--bg-hov)}
.tree-i.act{background:var(--bg-act)}
.tree-i.act::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--blue)}
.tree-ic{width:16px;height:16px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}
.tree-nm{font-family:'JetBrains Mono',monospace;font-size:11.5px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tree-acts{display:flex;gap:1px;opacity:0;transition:opacity var(--tr)}
.tree-i:hover .tree-acts{opacity:1}

/* Objects in tree */
.obj-tree{padding-left:36px}
.obj-item{display:flex;align-items:center;gap:5px;padding:3px 10px 3px 0;cursor:pointer;font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--txt2);transition:all var(--tr);border-radius:var(--rad);user-select:none}
.obj-item:hover{color:var(--txt);background:rgba(74,125,255,0.06)}
.obj-item.sel{color:var(--blue);background:rgba(74,125,255,0.1)}
.obj-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0}
.obj-vis{font-size:9px;opacity:0.4;cursor:pointer;margin-left:auto}
.obj-vis:hover{opacity:1}

/* Icon Button */
.ib{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:3px;border:none;background:transparent;color:var(--txt3);cursor:pointer;transition:all var(--tr);font-size:12px}
.ib:hover{background:var(--bg-hov);color:var(--txt)}
.ib.danger:hover{background:rgba(239,68,68,0.12);color:var(--red)}
.ib.primary{color:var(--blue)}
.ib.primary:hover{background:rgba(74,125,255,0.12)}

/* Center */
.center{flex:1;display:flex;flex-direction:column;overflow:hidden}

/* View Toggle */
.view-bar{display:flex;align-items:center;padding:0 12px;background:var(--bg-srf);border-bottom:1px solid var(--bdr);height:34px;gap:2px;flex-shrink:0}
.view-tab{padding:4px 12px;font-size:11px;font-weight:500;color:var(--txt3);cursor:pointer;border-radius:var(--rad);transition:all var(--tr);user-select:none;font-family:'DM Sans',sans-serif}
.view-tab:hover{color:var(--txt2);background:var(--bg-hov)}
.view-tab.act{color:var(--txt);background:var(--bg-elev);border:1px solid var(--bdr)}
.view-scene-name{margin-left:12px;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--txt2);display:flex;align-items:center;gap:6px}
.view-scene-dot{width:7px;height:7px;border-radius:50%;background:var(--blue)}

/* Canvas */
.canvas-wrap{flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-base);overflow:hidden;position:relative}
.canvas-outer{position:relative;border:1px solid var(--bdr);border-radius:var(--rad-lg);overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,0.4)}
.canvas-inner{position:relative;overflow:hidden;cursor:crosshair}
.canvas-grid{position:absolute;inset:0;pointer-events:none;opacity:0.06;background-image:linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px);background-size:32px 32px}

/* Game objects on canvas */
.gobj{position:absolute;cursor:pointer;transition:box-shadow 0.1s ease;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace}
.gobj:hover{z-index:10!important}
.gobj .gobj-label{position:absolute;top:-18px;left:0;font-size:9px;color:var(--txt2);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity var(--tr);background:rgba(0,0,0,0.7);padding:1px 5px;border-radius:2px}
.gobj:hover .gobj-label{opacity:1}
.gobj.selected{outline:2px solid var(--blue);outline-offset:1px}
.gobj.selected .gobj-label{opacity:1;color:var(--blue)}
.gobj.locked{cursor:default;opacity:0.6}
.gobj .gobj-handle{position:absolute;width:7px;height:7px;background:var(--blue);border:1px solid white;border-radius:1px;display:none}
.gobj.selected .gobj-handle{display:block}
.gobj .gobj-handle.tl{top:-4px;left:-4px;cursor:nw-resize}
.gobj .gobj-handle.tr{top:-4px;right:-4px;cursor:ne-resize}
.gobj .gobj-handle.bl{bottom:-4px;left:-4px;cursor:sw-resize}
.gobj .gobj-handle.br{bottom:-4px;right:-4px;cursor:se-resize}

/* Canvas toolbar */
.canvas-tools{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:4px;background:var(--bg-srf);border:1px solid var(--bdr);border-radius:var(--rad-lg);padding:4px 6px;box-shadow:0 4px 20px rgba(0,0,0,0.4)}
.ct-btn{padding:4px 10px;font-size:10.5px;font-family:'JetBrains Mono',monospace;color:var(--txt3);cursor:pointer;border:none;background:none;border-radius:var(--rad);transition:all var(--tr)}
.ct-btn:hover{color:var(--txt);background:var(--bg-hov)}
.ct-btn.act{color:var(--blue);background:rgba(74,125,255,0.12)}
.ct-sep{width:1px;background:var(--bdr);margin:2px 4px}

/* Canvas zoom */
.canvas-zoom{position:absolute;top:12px;right:12px;display:flex;gap:2px;background:var(--bg-srf);border:1px solid var(--bdr);border-radius:var(--rad);padding:2px;font-family:'JetBrains Mono',monospace;font-size:10.5px;align-items:center}
.canvas-zoom .zb{width:24px;height:22px;display:flex;align-items:center;justify-content:center;border:none;background:none;color:var(--txt2);cursor:pointer;border-radius:3px}
.canvas-zoom .zb:hover{background:var(--bg-hov);color:var(--txt)}
.canvas-zoom .zl{color:var(--txt3);padding:0 6px;min-width:38px;text-align:center}

/* Code panel */
.code-panel{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg-base)}
.code-scroll{flex:1;overflow:auto;display:flex}
.code-scroll::-webkit-scrollbar{width:5px;height:5px}
.code-scroll::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}
.ln{padding:14px 0;text-align:right;user-select:none;color:var(--txt3);font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;min-width:40px;padding-right:10px;flex-shrink:0;border-right:1px solid var(--bdr)}
.code-wrap{flex:1;position:relative;min-width:0}
.code-ta,.code-hl{font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;padding:14px;white-space:pre;tab-size:2}
.code-ta{position:absolute;inset:0;background:transparent;color:transparent;caret-color:var(--txt);border:none;outline:none;resize:none;z-index:2;width:100%;height:100%}
.code-hl{pointer-events:none;color:var(--txt)}

/* Right panel */
.right{width:280px;background:var(--bg-srf);border-left:1px solid var(--bdr);display:flex;flex-direction:column;flex-shrink:0}
.rt-tabs{display:flex;border-bottom:1px solid var(--bdr);flex-shrink:0}
.rt-tab{flex:1;padding:7px 0;text-align:center;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--txt3);cursor:pointer;transition:all var(--tr);position:relative;user-select:none}
.rt-tab:hover{color:var(--txt2)}
.rt-tab.act{color:var(--txt)}
.rt-tab.act::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:2px;background:var(--blue);border-radius:1px}
.rt-body{flex:1;overflow-y:auto;padding:12px}
.rt-body::-webkit-scrollbar{width:3px}
.rt-body::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}

/* Props */
.pg{margin-bottom:14px}
.pg-t{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.7px;color:var(--txt3);margin-bottom:6px}
.pr{display:flex;align-items:center;margin-bottom:5px;gap:6px}
.pr-l{font-size:11.5px;color:var(--txt2);width:70px;flex-shrink:0}
.pr-v{flex:1;background:var(--bg-elev);border:1px solid var(--bdr);border-radius:var(--rad);padding:3px 7px;color:var(--txt);font-size:11.5px;font-family:'JetBrains Mono',monospace;outline:none;transition:border-color var(--tr);min-width:0}
.pr-v:focus{border-color:var(--bdr-f)}
.pr-v[disabled]{opacity:0.4}

/* Insight cards */
.icard{background:var(--bg-elev);border:1px solid var(--bdr);border-radius:var(--rad-lg);padding:10px;margin-bottom:8px}
.icard-t{font-size:10px;font-weight:600;color:var(--txt3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mv{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:600;line-height:1}
.ml{font-size:9.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-top:1px}
.cbar{height:3px;background:var(--bg-base);border-radius:2px;overflow:hidden;margin-top:3px}
.cfill{height:100%;border-radius:2px;transition:width 0.3s ease}

/* Modal */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(3px)}
.modal{background:var(--bg-srf);border:1px solid var(--bdr);border-radius:var(--rad-lg);width:400px;box-shadow:0 8px 40px rgba(0,0,0,0.5)}
.modal-h{padding:12px 14px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:14px}
.modal-b{padding:14px;display:flex;flex-direction:column;gap:10px}
.modal-b label{font-size:10.5px;font-weight:600;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;display:block}
.modal-f{padding:10px 14px;border-top:1px solid var(--bdr);display:flex;justify-content:flex-end;gap:6px}
.btn{padding:5px 12px;border-radius:var(--rad);font-size:11.5px;font-weight:500;cursor:pointer;border:1px solid var(--bdr);background:var(--bg-elev);color:var(--txt);transition:all var(--tr);font-family:'DM Sans',sans-serif}
.btn:hover{background:var(--bg-hov)}
.btn.prim{background:var(--blue);border-color:var(--blue);color:white}
.btn.prim:hover{filter:brightness(0.9)}
.btn.dng{border-color:var(--red);color:var(--red);background:transparent}
.btn.dng:hover{background:rgba(239,68,68,0.12)}

/* Statusbar */
.sbar{height:22px;background:var(--bg-srf);border-top:1px solid var(--bdr);display:flex;align-items:center;padding:0 10px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--txt3);gap:14px;flex-shrink:0}
.sbar-dot{width:5px;height:5px;border-radius:50%;background:var(--green)}

/* Toast */
.toast-c{position:fixed;bottom:32px;right:14px;z-index:2000;display:flex;flex-direction:column;gap:4px}
.toast{background:var(--bg-elev);border:1px solid var(--bdr);border-radius:var(--rad);padding:6px 12px;font-size:11.5px;box-shadow:0 4px 16px rgba(0,0,0,0.4);animation:tin 0.2s ease;display:flex;align-items:center;gap:6px}
.toast.ok{border-left:3px solid var(--green)}
.toast.err{border-left:3px solid var(--red)}
.toast.inf{border-left:3px solid var(--blue)}
@keyframes tin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* Dropdown add-object */
.add-dd{position:absolute;top:100%;left:0;background:var(--bg-srf);border:1px solid var(--bdr);border-radius:var(--rad-lg);padding:4px;min-width:160px;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,0.5)}
.add-dd-i{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:var(--rad);cursor:pointer;font-size:11.5px;color:var(--txt2);transition:all var(--tr)}
.add-dd-i:hover{background:var(--bg-hov);color:var(--txt)}
.add-dd-i .add-dd-dot{width:10px;height:10px;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:8px;flex-shrink:0}

/* Empty state */
.empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--txt3);gap:8px}
.empty p{font-size:12px}
.empty small{font-size:10px;opacity:0.5}

/* Select obj type chip */
.type-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:500}
`;

// ── App ─────────────────────────────────────────────────────────────────
export default function PhaserEditor() {
  const [project, setProject] = useState(INITIAL_PROJECT);
  const [activeSceneId, setActiveSceneId] = useState("scene-2");
  const [selectedObjId, setSelectedObjId] = useState(null);
  const [viewMode, setViewMode] = useState("canvas"); // canvas | code
  const [rightTab, setRightTab] = useState("props");
  const [search, setSearch] = useState("");
  const [scenesOpen, setScenesOpen] = useState(true);
  const [modulesOpen, setModulesOpen] = useState(true);
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [addDrop, setAddDrop] = useState(false);
  const [dragging, setDragging] = useState(null);
  const canvasRef = useRef(null);

  const activeScene = project.scenes.find((s) => s.id === activeSceneId);
  const allItems = [...project.scenes, ...project.modules];
  const selectedObj = activeScene?.objects.find((o) => o.id === selectedObjId);

  const toast = useCallback((msg, type = "inf") => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }, []);

  // ── Scene CRUD ──
  const createScene = () => {
    setModal({ action: "create-scene" });
    setModalData({ name: "", description: "" });
  };
  const createModule = () => {
    setModal({ action: "create-module" });
    setModalData({ name: "", description: "" });
  };
  const deleteItem = (item, e) => {
    e?.stopPropagation();
    setModal({ action: "delete", item });
  };
  const doCreate = () => {
    if (!modalData.name?.trim()) return;
    const name = modalData.name.trim();
    if (modal.action === "create-scene") {
      const ns = {
        id: uid(), name, type: "scene", description: modalData.description || "",
        objects: [], code: `class ${name} extends Phaser.Scene {\n  constructor() { super({ key: '${name}' }); }\n  preload() {}\n  create() {}\n  update() {}\n}`,
      };
      setProject((p) => ({ ...p, scenes: [...p.scenes, ns] }));
      setActiveSceneId(ns.id);
      toast(`Created scene "${name}"`, "ok");
    } else {
      const nm = {
        id: uid(), name, type: "module", description: modalData.description || "",
        code: `export default class ${name} {\n  constructor(scene) { this.scene = scene; }\n  update() {}\n  destroy() {}\n}`,
      };
      setProject((p) => ({ ...p, modules: [...p.modules, nm] }));
      toast(`Created module "${name}"`, "ok");
    }
    setModal(null);
  };
  const doDelete = () => {
    const { item } = modal;
    if (item.type === "scene") {
      setProject((p) => ({ ...p, scenes: p.scenes.filter((s) => s.id !== item.id) }));
      if (activeSceneId === item.id) setActiveSceneId(project.scenes[0]?.id || null);
    } else {
      setProject((p) => ({ ...p, modules: p.modules.filter((m) => m.id !== item.id) }));
    }
    setModal(null);
    toast(`Deleted "${item.name}"`, "err");
  };

  // ── Object CRUD ──
  const addObject = (objType) => {
    if (!activeScene) return;
    const cfg = OBJ_TYPES[objType];
    const newObj = {
      id: uid(), name: `${objType}${activeScene.objects.length + 1}`, objType,
      x: 400 + Math.random() * 40 - 20, y: 300 + Math.random() * 40 - 20,
      w: objType === "text" ? 80 : objType === "zone" ? 80 : 40,
      h: objType === "text" ? 24 : objType === "zone" ? 80 : 40,
      color: cfg.color, visible: true, locked: false, props: {},
    };
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId ? { ...s, objects: [...s.objects, newObj] } : s
      ),
    }));
    setSelectedObjId(newObj.id);
    setAddDrop(false);
    toast(`Added ${cfg.label}`, "ok");
  };
  const deleteObject = (objId) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId ? { ...s, objects: s.objects.filter((o) => o.id !== objId) } : s
      ),
    }));
    if (selectedObjId === objId) setSelectedObjId(null);
    toast("Object removed", "err");
  };
  const updateObj = (objId, updates) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId
          ? { ...s, objects: s.objects.map((o) => (o.id === objId ? { ...o, ...updates } : o)) }
          : s
      ),
    }));
  };
  const updateObjProp = (objId, key, val) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) =>
        s.id === activeSceneId
          ? { ...s, objects: s.objects.map((o) => (o.id === objId ? { ...o, props: { ...o.props, [key]: val } } : o)) }
          : s
      ),
    }));
  };
  const toggleVisibility = (objId, e) => {
    e?.stopPropagation();
    const obj = activeScene?.objects.find((o) => o.id === objId);
    if (obj) updateObj(objId, { visible: !obj.visible });
  };

  // ── Code edit ──
  const updateSceneCode = (code) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) => (s.id === activeSceneId ? { ...s, code } : s)),
    }));
  };

  // ── Drag on canvas ──
  const handleCanvasMouseDown = (e, obj) => {
    if (obj.locked) return;
    e.stopPropagation();
    setSelectedObjId(obj.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
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
    const onMove = (e) => {
      const dx = (e.clientX - dragging.startX) / zoom;
      const dy = (e.clientY - dragging.startY) / zoom;
      updateObj(dragging.objId, {
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
  }, [dragging, zoom]);

  // ── Filter ──
  const fs = project.scenes.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const fm = project.modules.filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  // ── Insights calc ──
  const totalObj = project.scenes.reduce((s, sc) => s + sc.objects.length, 0);
  const totalCodeLines = allItems.reduce((s, i) => s + (i.code?.split("\n").length || 0), 0);

  return (
    <>
      <style>{CSS}</style>
      <div className="root">
        {/* Topbar */}
        <div className="topbar">
          <div className="logo">⬡ PHASER<span>.STUDIO</span></div>
          <div className="proj">{project.name}</div>
          <div className="spacer" />
          <div className="cfg">
            <span className="cfg-b">{project.config.width}×{project.config.height}</span>
            <span className="cfg-b">{project.config.physics}</span>
            <span className="cfg-b">{project.config.pixelArt ? "pixel" : "smooth"}</span>
          </div>
        </div>

        <div className="layout">
          {/* ── Sidebar ── */}
          <div className="side">
            <div className="side-hdr">
              <span className="side-t">Explorer</span>
              <div style={{ display: "flex", gap: 2 }}>
                <button className="ib primary" title="New Scene" onClick={createScene}>+</button>
              </div>
            </div>
            <div className="side-search">
              <input placeholder="Filter..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="side-body">
              {/* Scenes */}
              <div>
                <div className="sec-hdr" onClick={() => setScenesOpen((o) => !o)}>
                  <span style={{ fontSize: 8, transition: "transform 0.15s", transform: scenesOpen ? "rotate(90deg)" : "" }}>▶</span>
                  Scenes
                  <span className="sec-cnt">{fs.length}</span>
                </div>
                {scenesOpen && fs.map((scene) => (
                  <div key={scene.id}>
                    <div
                      className={`tree-i ${activeSceneId === scene.id ? "act" : ""}`}
                      onClick={() => { setActiveSceneId(scene.id); setSelectedObjId(null); }}
                    >
                      <div className="tree-ic" style={{ color: "var(--blue)", background: "rgba(74,125,255,0.1)" }}>□</div>
                      <span className="tree-nm">{scene.name}</span>
                      <span style={{ fontSize: 10, color: "var(--txt3)" }}>{scene.objects.length}</span>
                      <div className="tree-acts">
                        <button className="ib danger" title="Delete" onClick={(e) => deleteItem(scene, e)}>×</button>
                      </div>
                    </div>
                    {activeSceneId === scene.id && (
                      <div className="obj-tree">
                        {scene.objects.map((obj) => (
                          <div
                            key={obj.id}
                            className={`obj-item ${selectedObjId === obj.id ? "sel" : ""}`}
                            onClick={() => setSelectedObjId(obj.id)}
                          >
                            <div className="obj-dot" style={{ background: OBJ_TYPES[obj.objType]?.color || "#666" }} />
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obj.name}</span>
                            <span className="obj-vis" onClick={(e) => toggleVisibility(obj.id, e)}>{obj.visible ? "👁" : "—"}</span>
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
                  <span style={{ fontSize: 8, transition: "transform 0.15s", transform: modulesOpen ? "rotate(90deg)" : "" }}>▶</span>
                  Modules
                  <span className="sec-cnt">{fm.length}</span>
                  <div style={{ flex: 1 }} />
                  <button className="ib primary" title="New Module" style={{ marginRight: -4 }} onClick={(e) => { e.stopPropagation(); createModule(); }}>+</button>
                </div>
                {modulesOpen && fm.map((mod) => (
                  <div
                    key={mod.id}
                    className="tree-i"
                    onClick={() => { /* select module */ }}
                  >
                    <div className="tree-ic" style={{ color: "var(--purple)", background: "rgba(167,139,250,0.1)" }}>◈</div>
                    <span className="tree-nm">{mod.name}</span>
                    <div className="tree-acts">
                      <button className="ib danger" title="Delete" onClick={(e) => deleteItem(mod, e)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Center ── */}
          <div className="center">
            {/* View toggle bar */}
            <div className="view-bar">
              <div className={`view-tab ${viewMode === "canvas" ? "act" : ""}`} onClick={() => setViewMode("canvas")}>🎮 Stage</div>
              <div className={`view-tab ${viewMode === "code" ? "act" : ""}`} onClick={() => setViewMode("code")}>⟨/⟩ Code</div>
              {activeScene && (
                <div className="view-scene-name">
                  <span className="view-scene-dot" />
                  {activeScene.name}
                  <span style={{ color: "var(--txt3)", fontSize: 10 }}>— {activeScene.objects.length} objects</span>
                </div>
              )}
              <div className="spacer" />
              {viewMode === "canvas" && (
                <div style={{ position: "relative" }}>
                  <button className="btn prim" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setAddDrop((v) => !v)}>+ Add Object</button>
                  {addDrop && (
                    <div className="add-dd" style={{ right: 0, left: "auto" }}>
                      {Object.entries(OBJ_TYPES).map(([key, cfg]) => (
                        <div key={key} className="add-dd-i" onClick={() => addObject(key)}>
                          <div className="add-dd-dot" style={{ background: cfg.color, color: "white" }}>{cfg.icon}</div>
                          {cfg.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Canvas view */}
            {viewMode === "canvas" && activeScene ? (
              <div className="canvas-wrap" onClick={() => { setSelectedObjId(null); setAddDrop(false); }}>
                <div className="canvas-outer" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
                  <div
                    ref={canvasRef}
                    className="canvas-inner"
                    style={{ width: project.config.width, height: project.config.height, background: project.config.backgroundColor }}
                  >
                    {showGrid && <div className="canvas-grid" />}
                    {activeScene.objects.filter((o) => o.visible).map((obj, i) => {
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
                            border: isZone ? `1px dashed ${obj.color}60` : isText ? "none" : "none",
                            borderRadius: isCircle ? "50%" : obj.objType === "sprite" ? "3px" : "1px",
                            zIndex: i + 1,
                            fontSize: isText ? 11 : 8,
                            color: isText ? obj.color : "rgba(255,255,255,0.5)",
                            boxShadow: selectedObjId === obj.id ? `0 0 12px ${obj.color}40` : "none",
                            opacity: obj.locked ? 0.5 : 1,
                          }}
                          onClick={(e) => { e.stopPropagation(); setSelectedObjId(obj.id); setAddDrop(false); }}
                          onMouseDown={(e) => handleCanvasMouseDown(e, obj)}
                        >
                          {(showLabels || selectedObjId === obj.id) && <div className="gobj-label">{obj.name}</div>}
                          {isText ? (obj.props?.text || obj.name) : OBJ_TYPES[obj.objType]?.icon}
                          {!obj.locked && <>
                            <div className="gobj-handle tl" />
                            <div className="gobj-handle tr" />
                            <div className="gobj-handle bl" />
                            <div className="gobj-handle br" />
                          </>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Canvas zoom */}
                <div className="canvas-zoom">
                  <button className="zb" onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}>−</button>
                  <span className="zl">{Math.round(zoom * 100)}%</span>
                  <button className="zb" onClick={() => setZoom((z) => Math.min(2, z + 0.15))}>+</button>
                </div>

                {/* Canvas tools */}
                <div className="canvas-tools" onClick={(e) => e.stopPropagation()}>
                  <button className={`ct-btn ${showGrid ? "act" : ""}`} onClick={() => setShowGrid((v) => !v)}>Grid</button>
                  <button className={`ct-btn ${showLabels ? "act" : ""}`} onClick={() => setShowLabels((v) => !v)}>Labels</button>
                  <div className="ct-sep" />
                  {selectedObjId && selectedObj && !selectedObj.locked && (
                    <>
                      <button className="ct-btn" onClick={() => updateObj(selectedObjId, { locked: true })}>Lock</button>
                      <button className="ct-btn" style={{ color: "var(--red)" }} onClick={() => deleteObject(selectedObjId)}>Delete</button>
                    </>
                  )}
                  {selectedObjId && selectedObj?.locked && (
                    <button className="ct-btn" onClick={() => updateObj(selectedObjId, { locked: false })}>Unlock</button>
                  )}
                  {!selectedObjId && <span style={{ fontSize: 10, color: "var(--txt3)", padding: "0 8px" }}>Click objects to select</span>}
                </div>
              </div>
            ) : viewMode === "code" && activeScene ? (
              <div className="code-panel">
                <div className="code-scroll">
                  <div className="ln">
                    {activeScene.code.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
                  </div>
                  <div className="code-wrap">
                    <div className="code-hl" dangerouslySetInnerHTML={{ __html: highlightJS(activeScene.code) + "\n" }} />
                    <textarea className="code-ta" value={activeScene.code} onChange={(e) => updateSceneCode(e.target.value)} spellCheck={false} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty">
                <p>Select a scene from the sidebar</p>
                <small>Or create a new one</small>
              </div>
            )}
          </div>

          {/* ── Right Panel ── */}
          <div className="right">
            <div className="rt-tabs">
              <div className={`rt-tab ${rightTab === "props" ? "act" : ""}`} onClick={() => setRightTab("props")}>Properties</div>
              <div className={`rt-tab ${rightTab === "insights" ? "act" : ""}`} onClick={() => setRightTab("insights")}>Insights</div>
            </div>
            <div className="rt-body">
              {rightTab === "props" && selectedObj ? (
                <>
                  {/* Object identity */}
                  <div className="pg">
                    <div className="pg-t">Object</div>
                    <div className="pr">
                      <span className="pr-l">Name</span>
                      <input className="pr-v" value={selectedObj.name} onChange={(e) => updateObj(selectedObj.id, { name: e.target.value })} />
                    </div>
                    <div className="pr">
                      <span className="pr-l">Type</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                        <span className="type-chip" style={{ background: OBJ_TYPES[selectedObj.objType]?.color + "20", color: OBJ_TYPES[selectedObj.objType]?.color }}>
                          {OBJ_TYPES[selectedObj.objType]?.icon} {OBJ_TYPES[selectedObj.objType]?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transform */}
                  <div className="pg">
                    <div className="pg-t">Transform</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      {[["x", "X"], ["y", "Y"], ["w", "W"], ["h", "H"]].map(([k, l]) => (
                        <div className="pr" key={k} style={{ margin: 0 }}>
                          <span className="pr-l" style={{ width: 20 }}>{l}</span>
                          <input
                            className="pr-v"
                            type="number"
                            value={Math.round(selectedObj[k])}
                            onChange={(e) => updateObj(selectedObj.id, { [k]: +e.target.value })}
                            disabled={selectedObj.locked}
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
                        <div style={{ width: 22, height: 22, borderRadius: 4, background: selectedObj.color, border: "1px solid var(--bdr)", cursor: "pointer" }}
                          onClick={() => {
                            const el = document.createElement("input");
                            el.type = "color";
                            el.value = selectedObj.color;
                            el.addEventListener("input", (ev) => updateObj(selectedObj.id, { color: ev.target.value }));
                            el.click();
                          }}
                        />
                        <input className="pr-v" value={selectedObj.color} onChange={(e) => updateObj(selectedObj.id, { color: e.target.value })} />
                      </div>
                    </div>
                    <div className="pr">
                      <span className="pr-l">Visible</span>
                      <span
                        style={{ cursor: "pointer", color: selectedObj.visible ? "var(--green)" : "var(--red)" }}
                        onClick={() => updateObj(selectedObj.id, { visible: !selectedObj.visible })}
                      >
                        {selectedObj.visible ? "✓ Yes" : "✗ No"}
                      </span>
                    </div>
                    <div className="pr">
                      <span className="pr-l">Locked</span>
                      <span
                        style={{ cursor: "pointer", color: selectedObj.locked ? "var(--amber)" : "var(--txt3)" }}
                        onClick={() => updateObj(selectedObj.id, { locked: !selectedObj.locked })}
                      >
                        {selectedObj.locked ? "🔒 Yes" : "🔓 No"}
                      </span>
                    </div>
                  </div>

                  {/* Custom props */}
                  <div className="pg">
                    <div className="pg-t">Custom Properties</div>
                    {Object.entries(selectedObj.props).map(([key, val]) => (
                      <div className="pr" key={key}>
                        <span className="pr-l" style={{ fontSize: 10.5 }}>{key}</span>
                        <input className="pr-v" value={val} onChange={(e) => updateObjProp(selectedObj.id, key, e.target.value)} />
                      </div>
                    ))}
                    {Object.keys(selectedObj.props).length === 0 && (
                      <span style={{ fontSize: 11, color: "var(--txt3)", fontStyle: "italic" }}>No custom props</span>
                    )}
                    <button
                      className="btn"
                      style={{ marginTop: 6, fontSize: 10.5, padding: "3px 8px" }}
                      onClick={() => {
                        const key = prompt("Property name:");
                        if (key) updateObjProp(selectedObj.id, key, "");
                      }}
                    >
                      + Add Property
                    </button>
                  </div>

                  {/* Danger zone */}
                  <div className="pg">
                    <button className="btn dng" style={{ width: "100%", fontSize: 11 }} onClick={() => deleteObject(selectedObj.id)}>Delete Object</button>
                  </div>
                </>
              ) : rightTab === "props" && activeScene && !selectedObj ? (
                <>
                  <div className="pg">
                    <div className="pg-t">Scene</div>
                    <div className="pr">
                      <span className="pr-l">Name</span>
                      <input className="pr-v" value={activeScene.name} onChange={(e) => setProject((p) => ({ ...p, scenes: p.scenes.map((s) => s.id === activeSceneId ? { ...s, name: e.target.value } : s) }))} />
                    </div>
                    <div className="pr" style={{ alignItems: "flex-start" }}>
                      <span className="pr-l" style={{ marginTop: 4 }}>Desc</span>
                      <textarea
                        className="pr-v"
                        style={{ resize: "vertical", minHeight: 40, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}
                        value={activeScene.description}
                        onChange={(e) => setProject((p) => ({ ...p, scenes: p.scenes.map((s) => s.id === activeSceneId ? { ...s, description: e.target.value } : s) }))}
                      />
                    </div>
                  </div>
                  <div className="pg">
                    <div className="pg-t">Objects ({activeScene.objects.length})</div>
                    {activeScene.objects.map((obj) => (
                      <div key={obj.id} className="obj-item" style={{ padding: "4px 0", cursor: "pointer" }} onClick={() => setSelectedObjId(obj.id)}>
                        <div className="obj-dot" style={{ background: OBJ_TYPES[obj.objType]?.color }} />
                        <span style={{ flex: 1 }}>{obj.name}</span>
                        <span style={{ fontSize: 10, color: "var(--txt3)" }}>{OBJ_TYPES[obj.objType]?.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : rightTab === "props" ? (
                <div className="empty" style={{ padding: "40px 0" }}><p style={{ fontSize: 11 }}>Select a scene or object</p></div>
              ) : null}

              {rightTab === "insights" && (
                <>
                  <div className="icard">
                    <div className="icard-t">Project</div>
                    <div className="mgrid">
                      <div><div className="mv" style={{ color: "var(--blue)" }}>{project.scenes.length}</div><div className="ml">Scenes</div></div>
                      <div><div className="mv" style={{ color: "var(--purple)" }}>{project.modules.length}</div><div className="ml">Modules</div></div>
                      <div><div className="mv" style={{ color: "var(--green)" }}>{totalObj}</div><div className="ml">Objects</div></div>
                      <div><div className="mv" style={{ color: "var(--amber)" }}>{totalCodeLines}</div><div className="ml">Code Lines</div></div>
                    </div>
                  </div>

                  <div className="icard">
                    <div className="icard-t">Objects Per Scene</div>
                    {project.scenes.map((sc) => (
                      <div key={sc.id} style={{ marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>
                          <span style={{ color: "var(--txt2)" }}>{sc.name}</span>
                          <span style={{ color: "var(--blue)" }}>{sc.objects.length}</span>
                        </div>
                        <div className="cbar">
                          <div className="cfill" style={{ width: `${totalObj ? (sc.objects.length / totalObj) * 100 : 0}%`, background: "var(--blue)" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="icard">
                    <div className="icard-t">Object Type Distribution</div>
                    {Object.entries(
                      project.scenes.reduce((acc, sc) => {
                        sc.objects.forEach((o) => { acc[o.objType] = (acc[o.objType] || 0) + 1; });
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: OBJ_TYPES[type]?.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: "var(--txt2)", flex: 1, fontFamily: "'JetBrains Mono', monospace" }}>{OBJ_TYPES[type]?.label}</span>
                          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--txt3)" }}>{count}</span>
                        </div>
                      ))}
                  </div>

                  {activeScene && (
                    <div className="icard">
                      <div className="icard-t">{activeScene.name} — Layout</div>
                      <div style={{ position: "relative", width: "100%", paddingBottom: `${(project.config.height / project.config.width) * 100}%`, background: project.config.backgroundColor, borderRadius: "var(--rad)", overflow: "hidden", border: "1px solid var(--bdr)" }}>
                        {activeScene.objects.filter((o) => o.visible).map((obj) => (
                          <div
                            key={obj.id}
                            style={{
                              position: "absolute",
                              left: `${(obj.x - obj.w / 2) / project.config.width * 100}%`,
                              top: `${(obj.y - obj.h / 2) / project.config.height * 100}%`,
                              width: `${(obj.w / project.config.width) * 100}%`,
                              height: `${(obj.h / project.config.height) * 100}%`,
                              background: obj.objType === "zone" ? "transparent" : obj.color,
                              border: obj.objType === "zone" ? `1px dashed ${obj.color}40` : "none",
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
              )}
            </div>
          </div>
        </div>

        {/* Statusbar */}
        <div className="sbar">
          <span className="sbar-dot" />
          <span>Ready</span>
          <div className="spacer" />
          <span>{activeScene ? `${activeScene.name} — ${activeScene.objects.length} objects` : "No scene"}</span>
          <span>Phaser 3</span>
          <span>{zoom !== 1 ? `${Math.round(zoom * 100)}%` : "100%"}</span>
        </div>

        {/* Modal */}
        {modal && (
          <div className="modal-bg" onClick={() => setModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {(modal.action === "create-scene" || modal.action === "create-module") && (
                <>
                  <div className="modal-h">
                    <span>New {modal.action === "create-scene" ? "Scene" : "Module"}</span>
                    <button className="ib" onClick={() => setModal(null)}>×</button>
                  </div>
                  <div className="modal-b">
                    <div><label>Name</label><input className="pr-v" style={{ width: "100%" }} placeholder={modal.action === "create-scene" ? "e.g. MenuScene" : "e.g. ParticleSystem"} value={modalData.name || ""} onChange={(e) => setModalData((d) => ({ ...d, name: e.target.value }))} autoFocus onKeyDown={(e) => e.key === "Enter" && doCreate()} /></div>
                    <div><label>Description</label><textarea className="pr-v" style={{ width: "100%", resize: "vertical", minHeight: 40, fontFamily: "'DM Sans', sans-serif" }} value={modalData.description || ""} onChange={(e) => setModalData((d) => ({ ...d, description: e.target.value }))} /></div>
                  </div>
                  <div className="modal-f">
                    <button className="btn" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn prim" onClick={doCreate} disabled={!modalData.name?.trim()}>Create</button>
                  </div>
                </>
              )}
              {modal.action === "delete" && (
                <>
                  <div className="modal-h">
                    <span>Delete "{modal.item.name}"?</span>
                    <button className="ib" onClick={() => setModal(null)}>×</button>
                  </div>
                  <div className="modal-b">
                    <p style={{ fontSize: 12.5, color: "var(--txt2)" }}>This permanently removes the {modal.item.type} and cannot be undone.</p>
                  </div>
                  <div className="modal-f">
                    <button className="btn" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn dng" onClick={doDelete}>Delete</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="toast-c">
          {toasts.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
        </div>
      </div>
    </>
  );
}
