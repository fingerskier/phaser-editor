# AI-Driven Phaser Editor — Design Spec

**Date:** 2026-04-03
**Status:** Draft
**Project:** fingerskier/phaser-editor

## Overview

Re-imagine the Phaser Studio editor as an AI-driven game development tool. The user sees a live game editor in the browser. An AI agent (Claude Code) connects via MCP to read editor state, see what the user has selected, and make edits — all flowing through a unified undo/redo system. The user describes intent in the Claude Code terminal; the AI manipulates the game through MCP tools; the user sees results live in the browser.

## Architecture: SvelteKit Full-Stack Monolith

A single SvelteKit application serves the editor UI, internal API, and MCP endpoint in one process.

```
SvelteKit App (single process)
├── Svelte UI (editor chrome + embedded Phaser)
├── Server Routes
│   ├── /mcp — streamable HTTP MCP endpoint (Claude Code connects here)
│   └── /api/* — internal REST for UI ↔ server communication
├── Command System — all mutations flow through here
├── Svelte Stores — reactive state shared between UI and server
└── File I/O — persistence to project directory on disk
```

### Data Flow

Every mutation, regardless of source:

```
Mutation Source (UI click or MCP tool call)
  → Command object created (execute + undo methods)
  → commandBus.execute(cmd)
  → Command executes (modifies Phaser game objects + Svelte stores)
  → Push to undo stack
  → Truncate redo-forward history
  → Debounced persist to disk (500ms)
```

### Why SvelteKit

- Server routes are a natural fit for MCP's streamable HTTP transport
- Svelte stores provide reactive state that both UI and MCP tools read/write
- Single process — shared types, no sync protocol between frontend and backend
- Vite dev server with HMR for UI development

## Command System & Undo/Redo

### Command Interface

```typescript
interface Command {
  id: string;
  type: string;           // 'update_object', 'add_object', 'remove_object', etc.
  description: string;    // human-readable, e.g. "Set player.x = 200"
  source: 'user' | 'mcp'; // who initiated it
  execute(): void;
  undo(): void;
}
```

### Behavior

- **Atomic granularity**: Each discrete mutation is one command. Each MCP tool call produces one command. User drag operations batch as one command (drag-start → drag-end).
- **Linear stack with cursor**: Undo pops and calls `cmd.undo()`. Redo re-executes. New commands after an undo truncate the forward history.
- **The undo stack is a Svelte store**: UI reactively shows undo/redo availability. MCP tools can query history state.
- **Source tracking**: Each command records whether it came from `user` or `mcp`, enabling UI to show "AI changed player.x to 200" in a history panel if desired.

### Command Types

| Command | Fields | Description |
|---------|--------|-------------|
| `UpdateObjectCommand` | objectId, prop, from, to | Change a single property |
| `AddObjectCommand` | sceneId, object | Add a game object |
| `RemoveObjectCommand` | sceneId, object (snapshot) | Remove an object (stores snapshot for undo) |
| `UpdateCodeCommand` | targetId, from, to | Replace scene/module code |
| `AddSceneCommand` | scene | Create a new scene |
| `RemoveSceneCommand` | scene (snapshot) | Delete a scene |
| `UpdateConfigCommand` | prop, from, to | Change game config |

## MCP Server

### Transport

Streamable HTTP on SvelteKit server route `/mcp`. Claude Code connects as a remote MCP server:

```json
{
  "mcpServers": {
    "phaser-editor": {
      "url": "http://localhost:5173/mcp"
    }
  }
}
```

### Tool Catalog (15 tools)

**Read tools** (no commands created, just queries):

| Tool | Parameters | Returns |
|------|-----------|---------|
| `get_project` | — | Full project state: config, scene list, module list |
| `get_scene_tree` | sceneId | Hierarchical scene graph with all objects |
| `get_selection` | — | Currently selected object(s) with full properties |
| `get_object` | objectId | Detailed properties of a specific object |
| `get_screenshot` | — | Base64 PNG capture of current Phaser canvas |

**Write tools** (each creates a Command):

| Tool | Parameters | Description |
|------|-----------|-------------|
| `add_object` | sceneId, type, name, x, y, props? | Add a game object to a scene |
| `update_object` | objectId, props | Change one or more properties |
| `remove_object` | objectId | Delete an object |
| `update_scene_code` | sceneId, code | Replace a scene's Phaser code |
| `add_scene` | name, description? | Create a new scene |
| `remove_scene` | sceneId | Delete a scene |
| `update_config` | props | Change game config (dimensions, physics, etc.) |

**History tools:**

| Tool | Parameters | Description |
|------|-----------|-------------|
| `undo` | — | Undo the last command |
| `redo` | — | Redo the last undone command |

**Preview tools:**

| Tool | Parameters | Description |
|------|-----------|-------------|
| `restart_preview` | — | Restart the Phaser game instance |

### get_selection — The Key Tool

This is how the AI "sees" what the user is doing. Returns:

```typescript
{
  objects: Array<{
    id: string;
    name: string;
    type: string;         // 'sprite', 'text', 'rectangle', etc.
    sceneId: string;
    x: number; y: number; w: number; h: number;
    props: Record<string, any>;  // all custom properties
    parentId?: string;           // position in scene hierarchy
  }>;
}
```

The selection state lives in a Svelte store, updated by the UI overlay. The MCP tool just reads the store — no polling, always current.

## Embedded Phaser & Selection System

### Direct Embedding (No Iframe)

The Phaser `Game` instance mounts into a `<div>` managed by a Svelte component. This gives the editor native access to the Phaser scene graph — no postMessage bridge needed.

### Selection Overlay

A transparent Svelte-managed layer sits on top of the Phaser canvas:

- **Edit mode**: Overlay intercepts pointer events. Click to select, shift-click to multi-select. Selected objects get a bounding box with resize handles rendered by the overlay (not Phaser).
- **Play mode**: Overlay passes through all input to Phaser. User plays the game live. Selection disabled. AI can still observe via `get_screenshot`.

### Scene Graph Bridge

The Svelte store is the single source of truth. Phaser game objects are kept in sync as a rendering target:

- **Store → Phaser**: When a command updates the store (from any source), a reactive subscription applies the change to the corresponding Phaser game object. Phaser is a rendering slave — it never initiates state changes.
- **User interaction → Store**: When the user drags via the overlay, the overlay creates a command that updates the store. The store→Phaser subscription then moves the Phaser object.
- **MCP → Store**: When the AI calls `update_object`, same path — command updates store, Phaser follows.
- **Initial load**: On scene load, the store is populated from the JSON file, and Phaser objects are created to match.

### TypeScript Support

Scene and module files can be `.js` or `.ts`. TypeScript files are transpiled on the fly using esbuild's `transform` API before injection into the Phaser runtime. No `tsc` type-checking overhead — just fast transpilation.

## Editor UI Layout

### Three-Panel IDE Layout

```
┌─ Toolbar ─────────────────────────────────────────────────────────────┐
│ Logo | Project name | [EDIT] [PLAY] [CODE] | Undo Redo | ● MCP      │
├───────────┬───────────────────────────────────────────┬───────────────┤
│           │                                           │               │
│  Scene    │         Center Area                       │  Properties   │
│  Tree     │                                           │  Panel        │
│           │  EDIT: Phaser canvas + selection overlay   │               │
│  Scenes   │  PLAY: Full Phaser game (input passthru)  │  Transform    │
│  └ objects│  CODE: CodeMirror editor                  │  Appearance   │
│           │                                           │  Physics      │
│  Modules  │                                           │  Custom       │
│           │                                           │               │
├───────────┴───────────────────────────────────────────┴───────────────┤
│ StatusBar: scene info | game config | history depth | save status     │
└───────────────────────────────────────────────────────────────────────┘
```

### Key UI Elements

- **MCP connection indicator**: Shows when Claude Code is connected. User needs to know the AI can see their actions.
- **Mode toggle**: EDIT / PLAY / CODE — determines center area content and overlay behavior.
- **Undo/Redo buttons**: Visual indicators with command count. Tooltip shows last command description.
- **Scene tree**: Hierarchical, collapsible. Shows object names and types. Click to select (syncs with canvas selection).
- **Properties panel**: Context-sensitive. Shows selected object properties, editable inline. Changes create commands.

## File-Based Persistence

### Project Directory Structure

```
my-game/
├── project.json          # name, config (dimensions, physics, background)
├── scenes/
│   ├── MainScene.json    # scene metadata + object tree
│   ├── MainScene.ts      # Phaser scene class code (or .js)
│   ├── MenuScene.json
│   └── MenuScene.ts
├── modules/
│   ├── Player.ts         # helper module code
│   └── Utils.ts
└── assets/               # future: images, audio, spritesheets
```

### Behavior

- **Startup**: Server loads project directory into Svelte stores. Path provided via CLI argument or config.
- **Saving**: Every command execution triggers a debounced write (500ms) of only the affected file(s).
- **File watching**: Server watches for external file changes (e.g., user edits in VS Code) and syncs into stores.
- **Format**: Scene code is plain `.ts`/`.js` — editable outside the editor, git-diffable. Scene metadata (object tree) is JSON.
- **No database, no localStorage**: Just files. `git init` in the project directory for version control.

### project.json

```json
{
  "name": "my-game",
  "config": {
    "width": 800,
    "height": 600,
    "physics": "arcade",
    "pixelArt": false,
    "backgroundColor": "#1a1a2e"
  },
  "scenes": ["MainScene", "MenuScene"],
  "modules": ["Player", "Utils"]
}
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit (Svelte 5) |
| Language | TypeScript |
| Build | Vite (via SvelteKit) |
| Game engine | Phaser 3 (npm dependency, embedded directly) |
| Code editor | CodeMirror 6 |
| MCP transport | Streamable HTTP (on SvelteKit server route) |
| TS transpilation | esbuild transform API |
| Persistence | File system (Node.js fs) |
| Styling | CSS (custom dark theme, similar to current) |

## Migration Path

This is a full rewrite from React to SvelteKit. The current React codebase serves as reference for:

- UI layout and component structure
- Data model (Project, Scene, GameObject, Module types)
- Object type definitions and property schemas
- Code generation patterns for Phaser preview

The `phaser-editor-v2.jsx` monolith and current `src/` React code will be preserved in git history but replaced entirely.

## Open Issues Addressed

- **#26 No game preview**: Solved — Phaser embedded directly with live rendering
- **#29 No undo/redo**: Solved — command-based undo/redo system
- **#28 Resize handles visual-only**: Solved — overlay handles create real UpdateObjectCommands
- **#26 Game preview execution**: Solved — Phaser runs in the same DOM, esbuild transpiles TS on the fly

## Out of Scope (Future Work)

- Asset management (images, spritesheets, audio) — #30
- Export to standalone runnable Phaser game — #27
- Multi-user collaboration
- Cloud hosting / deployment
- Asset marketplace or template library
