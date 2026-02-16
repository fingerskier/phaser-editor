import type { ObjTypeMeta, Project } from "./types";

// ── Game Object Types ───────────────────────────────────────────────────
export const OBJ_TYPES: Record<string, ObjTypeMeta> = {
  sprite:    { label: "Sprite",    color: "#4a7dff", icon: "\u25C6" },
  text:      { label: "Text",      color: "#34d399", icon: "T" },
  rectangle: { label: "Rectangle", color: "#f59e0b", icon: "\u25AC" },
  circle:    { label: "Circle",    color: "#a78bfa", icon: "\u25CF" },
  image:     { label: "Image",     color: "#22d3ee", icon: "\u25A3" },
  tilemap:   { label: "Tilemap",   color: "#f472b6", icon: "\u25A6" },
  group:     { label: "Group",     color: "#fb923c", icon: "\u25C8" },
  particles: { label: "Particles", color: "#e879f9", icon: "\u2726" },
  zone:      { label: "Zone",      color: "#94a3b8", icon: "\u2B1A" },
};

// ── Initial project data ────────────────────────────────────────────────
export const INITIAL_PROJECT: Project = {
  name: "my-phaser-game",
  config: {
    width: 800,
    height: 600,
    physics: "arcade",
    pixelArt: true,
    backgroundColor: "#1a1a2e",
  },
  scenes: [
    {
      id: "scene-1",
      name: "BootScene",
      type: "scene",
      description: "Preloads assets and shows loading bar",
      objects: [
        { id: "obj-1a", name: "loadingBg",   objType: "rectangle", x: 300, y: 300, w: 320, h: 30,  color: "#333333", visible: true, locked: false, props: { fillColor: "0x333333" } },
        { id: "obj-1b", name: "loadingBar",  objType: "rectangle", x: 300, y: 300, w: 280, h: 22,  color: "#4a7dff", visible: true, locked: false, props: { fillColor: "0x4a7dff" } },
        { id: "obj-1c", name: "loadingText", objType: "text",      x: 400, y: 260, w: 120, h: 24,  color: "#34d399", visible: true, locked: false, props: { text: "Loading...", fontSize: "16px", fontFamily: "monospace" } },
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
      id: "scene-2",
      name: "GameScene",
      type: "scene",
      description: "Main gameplay with physics and input",
      objects: [
        { id: "obj-2a", name: "sky",       objType: "image",     x: 400, y: 300, w: 800, h: 600, color: "#1a1a4e", visible: true, locked: true,  props: { key: "sky", depth: 0 } },
        { id: "obj-2b", name: "ground",    objType: "tilemap",   x: 400, y: 568, w: 800, h: 64,  color: "#4a3728", visible: true, locked: true,  props: { key: "level1", layer: "Ground" } },
        { id: "obj-2c", name: "player",    objType: "sprite",    x: 100, y: 420, w: 32,  h: 48,  color: "#4a7dff", visible: true, locked: false, props: { key: "player", bounce: 0.1, collideWorld: true, gravity: 300 } },
        { id: "obj-2d", name: "enemy1",    objType: "sprite",    x: 450, y: 420, w: 32,  h: 32,  color: "#ef4444", visible: true, locked: false, props: { key: "slime", pattern: "patrol", speed: 80 } },
        { id: "obj-2e", name: "enemy2",    objType: "sprite",    x: 620, y: 420, w: 32,  h: 32,  color: "#ef4444", visible: true, locked: false, props: { key: "slime", pattern: "patrol", speed: 80 } },
        { id: "obj-2f", name: "coin1",     objType: "sprite",    x: 260, y: 340, w: 16,  h: 16,  color: "#f59e0b", visible: true, locked: false, props: { key: "coin", animated: true } },
        { id: "obj-2g", name: "coin2",     objType: "sprite",    x: 380, y: 280, w: 16,  h: 16,  color: "#f59e0b", visible: true, locked: false, props: { key: "coin", animated: true } },
        { id: "obj-2h", name: "coin3",     objType: "sprite",    x: 540, y: 340, w: 16,  h: 16,  color: "#f59e0b", visible: true, locked: false, props: { key: "coin", animated: true } },
        { id: "obj-2i", name: "platform1", objType: "rectangle", x: 350, y: 380, w: 120, h: 16,  color: "#6b5b3e", visible: true, locked: false, props: { isStatic: true } },
        { id: "obj-2j", name: "platform2", objType: "rectangle", x: 550, y: 310, w: 100, h: 16,  color: "#6b5b3e", visible: true, locked: false, props: { isStatic: true } },
        { id: "obj-2k", name: "spawnZone", objType: "zone",      x: 100, y: 300, w: 60,  h: 200, color: "#94a3b8", visible: true, locked: false, props: { purpose: "player_spawn" } },
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
      id: "scene-3",
      name: "UIScene",
      type: "scene",
      description: "HUD overlay for score and health",
      objects: [
        { id: "obj-3a", name: "scoreLabel",  objType: "text",      x: 16,  y: 16, w: 100, h: 20, color: "#34d399", visible: true, locked: false, props: { text: "Score: 0", fontSize: "18px", fontFamily: "monospace", stroke: "#000", strokeThickness: 3 } },
        { id: "obj-3b", name: "healthBarBg", objType: "rectangle", x: 700, y: 30, w: 104, h: 14, color: "#333333", visible: true, locked: false, props: {} },
        { id: "obj-3c", name: "healthBar",   objType: "rectangle", x: 700, y: 30, w: 100, h: 10, color: "#34d399", visible: true, locked: false, props: {} },
        { id: "obj-3d", name: "livesIcon1",  objType: "sprite",    x: 16,  y: 50, w: 16,  h: 16, color: "#ef4444", visible: true, locked: false, props: { key: "heart" } },
        { id: "obj-3e", name: "livesIcon2",  objType: "sprite",    x: 38,  y: 50, w: 16,  h: 16, color: "#ef4444", visible: true, locked: false, props: { key: "heart" } },
        { id: "obj-3f", name: "livesIcon3",  objType: "sprite",    x: 60,  y: 50, w: 16,  h: 16, color: "#ef4444", visible: true, locked: false, props: { key: "heart" } },
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
    {
      id: "mod-1",
      name: "PlayerController",
      type: "module",
      description: "Player movement and animation",
      code: `export default class PlayerController {\n  constructor(scene, sprite) { this.scene = scene; this.sprite = sprite; this.speed = 160; }\n  update(cursors) { /* movement logic */ }\n}`,
    },
    {
      id: "mod-2",
      name: "EnemyFactory",
      type: "module",
      description: "Enemy spawning and AI patterns",
      code: `export default class EnemyFactory {\n  constructor(scene) { this.scene = scene; this.enemies = scene.physics.add.group(); }\n  spawn(x, y, type) { return this.enemies.create(x, y, type); }\n  update() { /* patrol logic */ }\n}`,
    },
    {
      id: "mod-3",
      name: "AudioManager",
      type: "module",
      description: "Sound playback and pooling",
      code: `export default class AudioManager {\n  constructor(scene) { this.scene = scene; this.sounds = new Map(); }\n  play(key) { this.sounds.get(key)?.sound.play(); }\n}`,
    },
  ],
};
