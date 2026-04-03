# AI-Driven Phaser Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Phaser Studio editor as a SvelteKit app with embedded Phaser, MCP tools for AI interaction, command-based undo/redo, and file-based persistence.

**Architecture:** Single SvelteKit monolith serving editor UI, internal API, and MCP endpoint. All mutations (user and AI) flow through a Command System that handles undo/redo and persistence. Svelte stores are the source of truth; Phaser is a rendering target.

**Tech Stack:** SvelteKit (Svelte 5), TypeScript, Phaser 3, CodeMirror 6, @modelcontextprotocol/sdk, esbuild, Vite

---

## File Structure

```
src/
├── lib/
│   ├── types.ts                    # All TypeScript interfaces (Project, Scene, GameObject, Command, etc.)
│   ├── constants.ts                # Object type metadata, default project config
│   ├── stores/
│   │   ├── project.svelte.ts       # Project state: scenes, modules, config
│   │   ├── selection.svelte.ts     # Current selection state
│   │   └── history.svelte.ts       # Undo/redo stack
│   ├── commands/
│   │   ├── command-bus.ts          # Central command execution + undo/redo logic
│   │   ├── update-object.ts        # UpdateObjectCommand
│   │   ├── add-object.ts           # AddObjectCommand
│   │   ├── remove-object.ts        # RemoveObjectCommand
│   │   ├── update-code.ts          # UpdateCodeCommand
│   │   ├── add-scene.ts            # AddSceneCommand
│   │   ├── remove-scene.ts         # RemoveSceneCommand
│   │   └── update-config.ts        # UpdateConfigCommand
│   ├── mcp/
│   │   ├── server.ts               # McpServer instance + tool registration
│   │   └── tools/
│   │       ├── read-tools.ts       # get_project, get_scene_tree, get_selection, get_object, get_screenshot
│   │       └── write-tools.ts      # add_object, update_object, remove_object, update_scene_code, etc.
│   ├── persistence/
│   │   ├── load-project.ts         # Read project directory into store
│   │   ├── save-project.ts         # Write store state to project directory
│   │   └── watcher.ts              # File watcher for external changes
│   └── phaser/
│       ├── bridge.ts               # Store↔Phaser sync: creates/updates/removes Phaser objects from store state
│       └── transpile.ts            # esbuild transform for .ts scene/module files
├── routes/
│   ├── +page.svelte                # Main editor page
│   ├── +layout.svelte              # App shell layout
│   ├── mcp/
│   │   └── +server.ts              # MCP streamable HTTP endpoint
│   └── api/
│       ├── project/
│       │   └── +server.ts          # Load/save project API
│       └── screenshot/
│           └── +server.ts          # Screenshot capture endpoint
├── components/
│   ├── Toolbar.svelte              # Top bar: logo, project name, mode toggle, undo/redo, MCP status
│   ├── SceneTree.svelte            # Left panel: scene/module hierarchy
│   ├── PhaserCanvas.svelte         # Center: embedded Phaser game instance
│   ├── SelectionOverlay.svelte     # Transparent overlay for edit-mode selection/manipulation
│   ├── CodeEditor.svelte           # Center: CodeMirror 6 editor
│   ├── PropertiesPanel.svelte      # Right panel: selected object properties
│   ├── StatusBar.svelte            # Bottom: scene info, config, history, save status
│   └── Modal.svelte                # Create/delete dialogs
├── app.css                         # Global dark theme styles
└── app.html                        # HTML template
tests/
├── commands/
│   ├── command-bus.test.ts         # Command execution, undo, redo
│   ├── update-object.test.ts       # UpdateObjectCommand
│   ├── add-object.test.ts          # AddObjectCommand
│   └── remove-object.test.ts       # RemoveObjectCommand
├── stores/
│   ├── project.test.ts             # Project store CRUD
│   └── history.test.ts             # History store undo/redo state
├── mcp/
│   └── tools.test.ts               # MCP tool handlers
└── persistence/
    ├── load-project.test.ts        # Loading project from disk
    └── save-project.test.ts        # Saving project to disk
```

---

### Task 1: Scaffold SvelteKit Project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.css`, `src/routes/+page.svelte`, `src/routes/+layout.svelte`
- Remove: existing React `src/` directory (preserved in git history)

- [ ] **Step 1: Initialize SvelteKit project**

Run:
```bash
cd /c/dev/fingerskier/game/phaser-editor
# Back up current src
git stash
# Create SvelteKit project
npx sv create . --template minimal --types ts
```

Select: Svelte 5, TypeScript, no additional options.

- [ ] **Step 2: Install dependencies**

```bash
npm install phaser @modelcontextprotocol/sdk @codemirror/lang-javascript @codemirror/theme-one-dark codemirror zod esbuild
npm install -D vitest @testing-library/svelte jsdom
```

- [ ] **Step 3: Configure Vitest**

Add to `vite.config.ts`:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'jsdom',
	},
});
```

- [ ] **Step 4: Add test script to package.json**

Add `"test": "vitest"` and `"test:run": "vitest run"` to scripts.

- [ ] **Step 5: Create app.html template**

```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Phaser Editor</title>
	%sveltekit.head%
</head>
<body data-sveltekit-prerender="false">
	%sveltekit.body%
</body>
</html>
```

- [ ] **Step 6: Create minimal +layout.svelte**

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}
```

- [ ] **Step 7: Create placeholder +page.svelte**

```svelte
<!-- src/routes/+page.svelte -->
<h1>Phaser Editor</h1>
<p>Scaffolding complete.</p>
```

- [ ] **Step 8: Verify it runs**

Run: `npm run dev`
Expected: SvelteKit dev server starts, browser shows "Phaser Editor / Scaffolding complete."

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit project replacing React"
```

---

### Task 2: Types & Constants

**Files:**
- Create: `src/lib/types.ts`, `src/lib/constants.ts`

- [ ] **Step 1: Create types.ts**

```typescript
// src/lib/types.ts

export interface ProjectConfig {
	width: number;
	height: number;
	physics: string;
	pixelArt: boolean;
	backgroundColor: string;
}

export interface GameObject {
	id: string;
	name: string;
	objType: string;
	x: number;
	y: number;
	w: number;
	h: number;
	color: string;
	visible: boolean;
	locked: boolean;
	props: Record<string, string | number | boolean>;
}

export interface Scene {
	id: string;
	name: string;
	description: string;
	objects: GameObject[];
	code: string;
}

export interface Module {
	id: string;
	name: string;
	description: string;
	code: string;
}

export interface Project {
	name: string;
	config: ProjectConfig;
	scenes: Scene[];
	modules: Module[];
}

export type CommandSource = 'user' | 'mcp';

export interface Command {
	id: string;
	type: string;
	description: string;
	source: CommandSource;
	execute(): void;
	undo(): void;
}

export type ViewMode = 'edit' | 'play' | 'code';

export interface ObjTypeMeta {
	label: string;
	color: string;
	icon: string;
}
```

- [ ] **Step 2: Create constants.ts**

```typescript
// src/lib/constants.ts
import type { ObjTypeMeta } from './types.js';

export const OBJ_TYPES: Record<string, ObjTypeMeta> = {
	sprite:    { label: 'Sprite',    color: '#4a7dff', icon: '◆' },
	text:      { label: 'Text',      color: '#34d399', icon: 'T' },
	rectangle: { label: 'Rectangle', color: '#f59e0b', icon: '▬' },
	circle:    { label: 'Circle',    color: '#a78bfa', icon: '●' },
	image:     { label: 'Image',     color: '#22d3ee', icon: '▣' },
	tilemap:   { label: 'Tilemap',   color: '#f472b6', icon: '▦' },
	group:     { label: 'Group',     color: '#fb923c', icon: '◈' },
	particles: { label: 'Particles', color: '#e879f9', icon: '✦' },
	zone:      { label: 'Zone',      color: '#94a3b8', icon: '⬚' },
};

export const DEFAULT_CONFIG = {
	width: 800,
	height: 600,
	physics: 'arcade',
	pixelArt: false,
	backgroundColor: '#1a1a2e',
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts
git commit -m "feat: add types and constants for editor data model"
```

---

### Task 3: Svelte Stores (Project, Selection, History)

**Files:**
- Create: `src/lib/stores/project.svelte.ts`, `src/lib/stores/selection.svelte.ts`, `src/lib/stores/history.svelte.ts`
- Test: `tests/stores/project.test.ts`, `tests/stores/history.test.ts`

- [ ] **Step 1: Write failing test for project store**

```typescript
// tests/stores/project.test.ts
import { describe, it, expect } from 'vitest';
import { projectStore } from '$lib/stores/project.svelte.js';
import type { Project, Scene, GameObject } from '$lib/types.js';
import { DEFAULT_CONFIG } from '$lib/constants.js';

describe('projectStore', () => {
	it('initializes with empty project', () => {
		const store = projectStore();
		expect(store.project.name).toBe('');
		expect(store.project.scenes).toEqual([]);
		expect(store.project.modules).toEqual([]);
	});

	it('loads a project', () => {
		const store = projectStore();
		const project: Project = {
			name: 'test-game',
			config: { ...DEFAULT_CONFIG },
			scenes: [],
			modules: [],
		};
		store.load(project);
		expect(store.project.name).toBe('test-game');
	});

	it('finds a scene by id', () => {
		const store = projectStore();
		const scene: Scene = {
			id: 's1', name: 'Main', description: '', objects: [], code: '',
		};
		store.load({ name: 'test', config: { ...DEFAULT_CONFIG }, scenes: [scene], modules: [] });
		expect(store.getScene('s1')?.name).toBe('Main');
		expect(store.getScene('nonexistent')).toBeUndefined();
	});

	it('finds an object by id', () => {
		const store = projectStore();
		const obj: GameObject = {
			id: 'o1', name: 'player', objType: 'sprite',
			x: 0, y: 0, w: 32, h: 32, color: '#fff',
			visible: true, locked: false, props: {},
		};
		const scene: Scene = {
			id: 's1', name: 'Main', description: '', objects: [obj], code: '',
		};
		store.load({ name: 'test', config: { ...DEFAULT_CONFIG }, scenes: [scene], modules: [] });
		expect(store.getObject('o1')?.name).toBe('player');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/stores/project.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement project store**

```typescript
// src/lib/stores/project.svelte.ts
import type { Project, Scene, Module, GameObject } from '$lib/types.js';
import { DEFAULT_CONFIG } from '$lib/constants.js';

export function projectStore() {
	let project = $state<Project>({
		name: '',
		config: { ...DEFAULT_CONFIG },
		scenes: [],
		modules: [],
	});

	function load(p: Project) {
		project.name = p.name;
		project.config = { ...p.config };
		project.scenes = p.scenes.map(s => ({ ...s, objects: [...s.objects] }));
		project.modules = p.modules.map(m => ({ ...m }));
	}

	function getScene(id: string): Scene | undefined {
		return project.scenes.find(s => s.id === id);
	}

	function getModule(id: string): Module | undefined {
		return project.modules.find(m => m.id === id);
	}

	function getObject(id: string): GameObject | undefined {
		for (const scene of project.scenes) {
			const obj = scene.objects.find(o => o.id === id);
			if (obj) return obj;
		}
		return undefined;
	}

	function getObjectScene(objectId: string): Scene | undefined {
		return project.scenes.find(s => s.objects.some(o => o.id === objectId));
	}

	return {
		get project() { return project; },
		load,
		getScene,
		getModule,
		getObject,
		getObjectScene,
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/stores/project.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing test for history store**

```typescript
// tests/stores/history.test.ts
import { describe, it, expect } from 'vitest';
import { historyStore } from '$lib/stores/history.svelte.js';
import type { Command } from '$lib/types.js';

function makeCommand(desc: string, state: { value: number }): Command {
	const from = state.value;
	const to = from + 1;
	return {
		id: crypto.randomUUID(),
		type: 'test',
		description: desc,
		source: 'user',
		execute() { state.value = to; },
		undo() { state.value = from; },
	};
}

describe('historyStore', () => {
	it('starts empty', () => {
		const history = historyStore();
		expect(history.canUndo).toBe(false);
		expect(history.canRedo).toBe(false);
	});

	it('executes a command and allows undo', () => {
		const history = historyStore();
		const state = { value: 0 };
		const cmd = makeCommand('increment', state);
		history.execute(cmd);
		expect(state.value).toBe(1);
		expect(history.canUndo).toBe(true);
		history.undo();
		expect(state.value).toBe(0);
		expect(history.canUndo).toBe(false);
	});

	it('supports redo after undo', () => {
		const history = historyStore();
		const state = { value: 0 };
		history.execute(makeCommand('inc', state));
		history.undo();
		expect(history.canRedo).toBe(true);
		history.redo();
		expect(state.value).toBe(1);
	});

	it('truncates redo stack on new command', () => {
		const history = historyStore();
		const state = { value: 0 };
		history.execute(makeCommand('inc1', state));
		history.execute(makeCommand('inc2', state));
		history.undo();
		expect(history.canRedo).toBe(true);
		history.execute(makeCommand('inc3', state));
		expect(history.canRedo).toBe(false);
	});
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/stores/history.test.ts`
Expected: FAIL — module not found

- [ ] **Step 7: Implement history store**

```typescript
// src/lib/stores/history.svelte.ts
import type { Command } from '$lib/types.js';

export function historyStore() {
	let stack = $state<Command[]>([]);
	let cursor = $state(0); // points to next insertion index
	let canUndo = $derived(cursor > 0);
	let canRedo = $derived(cursor < stack.length);

	function execute(cmd: Command) {
		cmd.execute();
		// Truncate any redo-forward history
		stack = stack.slice(0, cursor);
		stack.push(cmd);
		cursor = stack.length;
	}

	function undo(): Command | undefined {
		if (!canUndo) return undefined;
		cursor--;
		const cmd = stack[cursor];
		cmd.undo();
		return cmd;
	}

	function redo(): Command | undefined {
		if (!canRedo) return undefined;
		const cmd = stack[cursor];
		cmd.execute();
		cursor++;
		return cmd;
	}

	function clear() {
		stack = [];
		cursor = 0;
	}

	return {
		get canUndo() { return canUndo; },
		get canRedo() { return canRedo; },
		get depth() { return cursor; },
		get stack() { return stack; },
		execute,
		undo,
		redo,
		clear,
	};
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run tests/stores/history.test.ts`
Expected: PASS

- [ ] **Step 9: Implement selection store**

```typescript
// src/lib/stores/selection.svelte.ts
import type { GameObject } from '$lib/types.js';

export function selectionStore() {
	let selectedIds = $state<string[]>([]);

	function select(id: string) {
		selectedIds = [id];
	}

	function toggleSelect(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter(i => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function clear() {
		selectedIds = [];
	}

	function isSelected(id: string): boolean {
		return selectedIds.includes(id);
	}

	return {
		get selectedIds() { return selectedIds; },
		select,
		toggleSelect,
		clear,
		isSelected,
	};
}
```

- [ ] **Step 10: Commit**

```bash
git add src/lib/stores/ tests/stores/
git commit -m "feat: add project, selection, and history stores with tests"
```

---

### Task 4: Command System

**Files:**
- Create: `src/lib/commands/command-bus.ts`, `src/lib/commands/update-object.ts`, `src/lib/commands/add-object.ts`, `src/lib/commands/remove-object.ts`, `src/lib/commands/update-code.ts`, `src/lib/commands/add-scene.ts`, `src/lib/commands/remove-scene.ts`, `src/lib/commands/update-config.ts`
- Test: `tests/commands/command-bus.test.ts`, `tests/commands/update-object.test.ts`, `tests/commands/add-object.test.ts`, `tests/commands/remove-object.test.ts`

- [ ] **Step 1: Write failing test for command-bus**

```typescript
// tests/commands/command-bus.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createCommandBus } from '$lib/commands/command-bus.js';

describe('createCommandBus', () => {
	it('executes commands through history store', () => {
		const mockHistory = {
			execute: vi.fn(),
			undo: vi.fn(),
			redo: vi.fn(),
		};
		const bus = createCommandBus(mockHistory as any);
		const cmd = {
			id: '1', type: 'test', description: 'test', source: 'user' as const,
			execute: vi.fn(), undo: vi.fn(),
		};
		bus.execute(cmd);
		expect(mockHistory.execute).toHaveBeenCalledWith(cmd);
	});

	it('notifies listeners on execute', () => {
		const mockHistory = { execute: vi.fn(), undo: vi.fn(), redo: vi.fn() };
		const bus = createCommandBus(mockHistory as any);
		const listener = vi.fn();
		bus.onExecute(listener);
		const cmd = {
			id: '1', type: 'test', description: 'test', source: 'user' as const,
			execute: vi.fn(), undo: vi.fn(),
		};
		bus.execute(cmd);
		expect(listener).toHaveBeenCalledWith(cmd);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/commands/command-bus.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement command-bus**

```typescript
// src/lib/commands/command-bus.ts
import type { Command } from '$lib/types.js';

interface HistoryLike {
	execute(cmd: Command): void;
	undo(): Command | undefined;
	redo(): Command | undefined;
}

export function createCommandBus(history: HistoryLike) {
	const listeners: Array<(cmd: Command) => void> = [];

	function execute(cmd: Command) {
		history.execute(cmd);
		for (const fn of listeners) fn(cmd);
	}

	function undo() {
		return history.undo();
	}

	function redo() {
		return history.redo();
	}

	function onExecute(fn: (cmd: Command) => void) {
		listeners.push(fn);
		return () => {
			const idx = listeners.indexOf(fn);
			if (idx >= 0) listeners.splice(idx, 1);
		};
	}

	return { execute, undo, redo, onExecute };
}

export type CommandBus = ReturnType<typeof createCommandBus>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/commands/command-bus.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing test for UpdateObjectCommand**

```typescript
// tests/commands/update-object.test.ts
import { describe, it, expect } from 'vitest';
import { createUpdateObjectCommand } from '$lib/commands/update-object.js';
import type { GameObject } from '$lib/types.js';

describe('UpdateObjectCommand', () => {
	it('updates a property and undoes it', () => {
		const obj: GameObject = {
			id: 'o1', name: 'player', objType: 'sprite',
			x: 100, y: 200, w: 32, h: 32, color: '#fff',
			visible: true, locked: false, props: {},
		};
		const getObject = (id: string) => id === 'o1' ? obj : undefined;
		const cmd = createUpdateObjectCommand(getObject, 'o1', 'x', 300, 'user');

		cmd.execute();
		expect(obj.x).toBe(300);

		cmd.undo();
		expect(obj.x).toBe(100);
	});
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/commands/update-object.test.ts`
Expected: FAIL

- [ ] **Step 7: Implement UpdateObjectCommand**

```typescript
// src/lib/commands/update-object.ts
import type { Command, CommandSource, GameObject } from '$lib/types.js';

export function createUpdateObjectCommand(
	getObject: (id: string) => GameObject | undefined,
	objectId: string,
	prop: string,
	value: unknown,
	source: CommandSource,
): Command {
	const obj = getObject(objectId);
	if (!obj) throw new Error(`Object ${objectId} not found`);

	const from = (obj as any)[prop] ?? obj.props[prop];
	const isCoreProp = prop in obj && prop !== 'props';

	return {
		id: crypto.randomUUID(),
		type: 'update_object',
		description: `Set ${obj.name}.${prop} = ${JSON.stringify(value)}`,
		source,
		execute() {
			const target = getObject(objectId)!;
			if (isCoreProp) {
				(target as any)[prop] = value;
			} else {
				target.props[prop] = value as string | number | boolean;
			}
		},
		undo() {
			const target = getObject(objectId)!;
			if (isCoreProp) {
				(target as any)[prop] = from;
			} else {
				if (from === undefined) {
					delete target.props[prop];
				} else {
					target.props[prop] = from as string | number | boolean;
				}
			}
		},
	};
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run tests/commands/update-object.test.ts`
Expected: PASS

- [ ] **Step 9: Write failing test for AddObjectCommand**

```typescript
// tests/commands/add-object.test.ts
import { describe, it, expect } from 'vitest';
import { createAddObjectCommand } from '$lib/commands/add-object.js';
import type { Scene, GameObject } from '$lib/types.js';

describe('AddObjectCommand', () => {
	it('adds an object and undoes it', () => {
		const scene: Scene = { id: 's1', name: 'Main', description: '', objects: [], code: '' };
		const getScene = (id: string) => id === 's1' ? scene : undefined;
		const obj: GameObject = {
			id: 'o1', name: 'enemy', objType: 'sprite',
			x: 50, y: 50, w: 32, h: 32, color: '#f00',
			visible: true, locked: false, props: {},
		};
		const cmd = createAddObjectCommand(getScene, 's1', obj, 'mcp');

		cmd.execute();
		expect(scene.objects).toHaveLength(1);
		expect(scene.objects[0].name).toBe('enemy');

		cmd.undo();
		expect(scene.objects).toHaveLength(0);
	});
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npx vitest run tests/commands/add-object.test.ts`
Expected: FAIL

- [ ] **Step 11: Implement AddObjectCommand**

```typescript
// src/lib/commands/add-object.ts
import type { Command, CommandSource, Scene, GameObject } from '$lib/types.js';

export function createAddObjectCommand(
	getScene: (id: string) => Scene | undefined,
	sceneId: string,
	object: GameObject,
	source: CommandSource,
): Command {
	return {
		id: crypto.randomUUID(),
		type: 'add_object',
		description: `Add ${object.objType} "${object.name}" to scene`,
		source,
		execute() {
			const scene = getScene(sceneId);
			if (!scene) throw new Error(`Scene ${sceneId} not found`);
			scene.objects.push({ ...object });
		},
		undo() {
			const scene = getScene(sceneId);
			if (!scene) return;
			const idx = scene.objects.findIndex(o => o.id === object.id);
			if (idx >= 0) scene.objects.splice(idx, 1);
		},
	};
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npx vitest run tests/commands/add-object.test.ts`
Expected: PASS

- [ ] **Step 13: Write failing test for RemoveObjectCommand**

```typescript
// tests/commands/remove-object.test.ts
import { describe, it, expect } from 'vitest';
import { createRemoveObjectCommand } from '$lib/commands/remove-object.js';
import type { Scene, GameObject } from '$lib/types.js';

describe('RemoveObjectCommand', () => {
	it('removes an object and restores it on undo', () => {
		const obj: GameObject = {
			id: 'o1', name: 'player', objType: 'sprite',
			x: 10, y: 20, w: 32, h: 32, color: '#fff',
			visible: true, locked: false, props: { speed: 100 },
		};
		const scene: Scene = { id: 's1', name: 'Main', description: '', objects: [obj], code: '' };
		const getScene = (id: string) => id === 's1' ? scene : undefined;
		const cmd = createRemoveObjectCommand(getScene, 's1', 'o1', 'user');

		cmd.execute();
		expect(scene.objects).toHaveLength(0);

		cmd.undo();
		expect(scene.objects).toHaveLength(1);
		expect(scene.objects[0].name).toBe('player');
		expect(scene.objects[0].props.speed).toBe(100);
	});
});
```

- [ ] **Step 14: Run test to verify it fails**

Run: `npx vitest run tests/commands/remove-object.test.ts`
Expected: FAIL

- [ ] **Step 15: Implement RemoveObjectCommand**

```typescript
// src/lib/commands/remove-object.ts
import type { Command, CommandSource, Scene, GameObject } from '$lib/types.js';

export function createRemoveObjectCommand(
	getScene: (id: string) => Scene | undefined,
	sceneId: string,
	objectId: string,
	source: CommandSource,
): Command {
	let snapshot: GameObject | undefined;
	let index = -1;

	return {
		id: crypto.randomUUID(),
		type: 'remove_object',
		description: `Remove object ${objectId}`,
		source,
		execute() {
			const scene = getScene(sceneId);
			if (!scene) throw new Error(`Scene ${sceneId} not found`);
			index = scene.objects.findIndex(o => o.id === objectId);
			if (index < 0) throw new Error(`Object ${objectId} not found`);
			snapshot = JSON.parse(JSON.stringify(scene.objects[index]));
			scene.objects.splice(index, 1);
		},
		undo() {
			const scene = getScene(sceneId);
			if (!scene || !snapshot) return;
			scene.objects.splice(index, 0, snapshot);
		},
	};
}
```

- [ ] **Step 16: Run test to verify it passes**

Run: `npx vitest run tests/commands/remove-object.test.ts`
Expected: PASS

- [ ] **Step 17: Implement remaining commands (UpdateCode, AddScene, RemoveScene, UpdateConfig)**

```typescript
// src/lib/commands/update-code.ts
import type { Command, CommandSource, Scene, Module } from '$lib/types.js';

export function createUpdateCodeCommand(
	getTarget: (id: string) => Scene | Module | undefined,
	targetId: string,
	newCode: string,
	source: CommandSource,
): Command {
	const target = getTarget(targetId);
	if (!target) throw new Error(`Target ${targetId} not found`);
	const oldCode = target.code;

	return {
		id: crypto.randomUUID(),
		type: 'update_code',
		description: `Update code for "${target.name}"`,
		source,
		execute() {
			const t = getTarget(targetId);
			if (t) t.code = newCode;
		},
		undo() {
			const t = getTarget(targetId);
			if (t) t.code = oldCode;
		},
	};
}
```

```typescript
// src/lib/commands/add-scene.ts
import type { Command, CommandSource, Scene, Project } from '$lib/types.js';

export function createAddSceneCommand(
	getProject: () => Project,
	scene: Scene,
	source: CommandSource,
): Command {
	return {
		id: crypto.randomUUID(),
		type: 'add_scene',
		description: `Add scene "${scene.name}"`,
		source,
		execute() {
			getProject().scenes.push({ ...scene, objects: [...scene.objects] });
		},
		undo() {
			const p = getProject();
			const idx = p.scenes.findIndex(s => s.id === scene.id);
			if (idx >= 0) p.scenes.splice(idx, 1);
		},
	};
}
```

```typescript
// src/lib/commands/remove-scene.ts
import type { Command, CommandSource, Scene, Project } from '$lib/types.js';

export function createRemoveSceneCommand(
	getProject: () => Project,
	sceneId: string,
	source: CommandSource,
): Command {
	let snapshot: Scene | undefined;
	let index = -1;

	return {
		id: crypto.randomUUID(),
		type: 'remove_scene',
		description: `Remove scene ${sceneId}`,
		source,
		execute() {
			const p = getProject();
			index = p.scenes.findIndex(s => s.id === sceneId);
			if (index < 0) throw new Error(`Scene ${sceneId} not found`);
			snapshot = JSON.parse(JSON.stringify(p.scenes[index]));
			p.scenes.splice(index, 1);
		},
		undo() {
			const p = getProject();
			if (snapshot) p.scenes.splice(index, 0, snapshot);
		},
	};
}
```

```typescript
// src/lib/commands/update-config.ts
import type { Command, CommandSource, ProjectConfig, Project } from '$lib/types.js';

export function createUpdateConfigCommand(
	getProject: () => Project,
	prop: keyof ProjectConfig,
	value: ProjectConfig[keyof ProjectConfig],
	source: CommandSource,
): Command {
	const from = getProject().config[prop];

	return {
		id: crypto.randomUUID(),
		type: 'update_config',
		description: `Set config.${prop} = ${JSON.stringify(value)}`,
		source,
		execute() {
			(getProject().config as any)[prop] = value;
		},
		undo() {
			(getProject().config as any)[prop] = from;
		},
	};
}
```

- [ ] **Step 18: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 19: Commit**

```bash
git add src/lib/commands/ tests/commands/
git commit -m "feat: add command system with undo/redo for all mutation types"
```

---

### Task 5: File-Based Persistence

**Files:**
- Create: `src/lib/persistence/load-project.ts`, `src/lib/persistence/save-project.ts`, `src/lib/persistence/watcher.ts`
- Test: `tests/persistence/load-project.test.ts`, `tests/persistence/save-project.test.ts`

- [ ] **Step 1: Write failing test for load-project**

```typescript
// tests/persistence/load-project.test.ts
import { describe, it, expect } from 'vitest';
import { loadProject } from '$lib/persistence/load-project.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpProject(): string {
	const dir = join(tmpdir(), `phaser-test-${Date.now()}`);
	mkdirSync(join(dir, 'scenes'), { recursive: true });
	mkdirSync(join(dir, 'modules'), { recursive: true });
	writeFileSync(join(dir, 'project.json'), JSON.stringify({
		name: 'test-game',
		config: { width: 800, height: 600, physics: 'arcade', pixelArt: false, backgroundColor: '#000' },
		scenes: ['Main'],
		modules: ['Utils'],
	}));
	writeFileSync(join(dir, 'scenes', 'Main.json'), JSON.stringify({
		id: 's1', name: 'Main', description: 'Main scene',
		objects: [{ id: 'o1', name: 'player', objType: 'sprite', x: 0, y: 0, w: 32, h: 32, color: '#fff', visible: true, locked: false, props: {} }],
	}));
	writeFileSync(join(dir, 'scenes', 'Main.ts'), 'class Main extends Phaser.Scene {}');
	writeFileSync(join(dir, 'modules', 'Utils.ts'), 'export default class Utils {}');
	return dir;
}

describe('loadProject', () => {
	it('loads project from directory', async () => {
		const dir = makeTmpProject();
		try {
			const project = await loadProject(dir);
			expect(project.name).toBe('test-game');
			expect(project.scenes).toHaveLength(1);
			expect(project.scenes[0].name).toBe('Main');
			expect(project.scenes[0].objects).toHaveLength(1);
			expect(project.scenes[0].code).toContain('Phaser.Scene');
			expect(project.modules).toHaveLength(1);
			expect(project.modules[0].name).toBe('Utils');
		} finally {
			rmSync(dir, { recursive: true });
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/persistence/load-project.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement load-project**

```typescript
// src/lib/persistence/load-project.ts
import { readFile, readdir } from 'node:fs/promises';
import { join, parse } from 'node:path';
import type { Project, Scene, Module } from '$lib/types.js';

interface ProjectManifest {
	name: string;
	config: Project['config'];
	scenes: string[];
	modules: string[];
}

export async function loadProject(dir: string): Promise<Project> {
	const raw = await readFile(join(dir, 'project.json'), 'utf-8');
	const manifest: ProjectManifest = JSON.parse(raw);

	const scenes: Scene[] = [];
	for (const sceneName of manifest.scenes) {
		const metaRaw = await readFile(join(dir, 'scenes', `${sceneName}.json`), 'utf-8');
		const meta = JSON.parse(metaRaw);

		let code = '';
		const codeFiles = [`${sceneName}.ts`, `${sceneName}.js`];
		for (const f of codeFiles) {
			try {
				code = await readFile(join(dir, 'scenes', f), 'utf-8');
				break;
			} catch { /* try next */ }
		}

		scenes.push({
			id: meta.id,
			name: meta.name,
			description: meta.description || '',
			objects: meta.objects || [],
			code,
		});
	}

	const modules: Module[] = [];
	for (const modName of manifest.modules) {
		let code = '';
		const codeFiles = [`${modName}.ts`, `${modName}.js`];
		for (const f of codeFiles) {
			try {
				code = await readFile(join(dir, 'modules', f), 'utf-8');
				break;
			} catch { /* try next */ }
		}

		modules.push({
			id: `mod-${modName.toLowerCase()}`,
			name: modName,
			description: '',
			code,
		});
	}

	return {
		name: manifest.name,
		config: manifest.config,
		scenes,
		modules,
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/persistence/load-project.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing test for save-project**

```typescript
// tests/persistence/save-project.test.ts
import { describe, it, expect } from 'vitest';
import { saveProject } from '$lib/persistence/save-project.js';
import { loadProject } from '$lib/persistence/load-project.js';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Project } from '$lib/types.js';

describe('saveProject', () => {
	it('writes project to disk and round-trips via loadProject', async () => {
		const dir = join(tmpdir(), `phaser-save-test-${Date.now()}`);
		mkdirSync(dir, { recursive: true });
		try {
			const project: Project = {
				name: 'saved-game',
				config: { width: 640, height: 480, physics: 'matter', pixelArt: true, backgroundColor: '#111' },
				scenes: [{
					id: 's1', name: 'Level1', description: 'First level',
					objects: [{ id: 'o1', name: 'hero', objType: 'sprite', x: 10, y: 20, w: 32, h: 32, color: '#0f0', visible: true, locked: false, props: {} }],
					code: 'class Level1 extends Phaser.Scene {}',
				}],
				modules: [{ id: 'mod-1', name: 'Helper', description: 'Helper module', code: 'export default class Helper {}' }],
			};

			await saveProject(dir, project);

			expect(existsSync(join(dir, 'project.json'))).toBe(true);
			expect(existsSync(join(dir, 'scenes', 'Level1.json'))).toBe(true);
			expect(existsSync(join(dir, 'scenes', 'Level1.ts'))).toBe(true);
			expect(existsSync(join(dir, 'modules', 'Helper.ts'))).toBe(true);

			const loaded = await loadProject(dir);
			expect(loaded.name).toBe('saved-game');
			expect(loaded.scenes[0].objects[0].name).toBe('hero');
			expect(loaded.modules[0].code).toContain('Helper');
		} finally {
			rmSync(dir, { recursive: true });
		}
	});
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/persistence/save-project.test.ts`
Expected: FAIL

- [ ] **Step 7: Implement save-project**

```typescript
// src/lib/persistence/save-project.ts
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Project } from '$lib/types.js';

export async function saveProject(dir: string, project: Project): Promise<void> {
	await mkdir(join(dir, 'scenes'), { recursive: true });
	await mkdir(join(dir, 'modules'), { recursive: true });

	const manifest = {
		name: project.name,
		config: project.config,
		scenes: project.scenes.map(s => s.name),
		modules: project.modules.map(m => m.name),
	};
	await writeFile(join(dir, 'project.json'), JSON.stringify(manifest, null, 2));

	for (const scene of project.scenes) {
		const meta = {
			id: scene.id,
			name: scene.name,
			description: scene.description,
			objects: scene.objects,
		};
		await writeFile(join(dir, 'scenes', `${scene.name}.json`), JSON.stringify(meta, null, 2));
		await writeFile(join(dir, 'scenes', `${scene.name}.ts`), scene.code);
	}

	for (const mod of project.modules) {
		await writeFile(join(dir, 'modules', `${mod.name}.ts`), mod.code);
	}
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSave(dir: string, project: Project, delay = 500): void {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => saveProject(dir, project), delay);
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run tests/persistence/save-project.test.ts`
Expected: PASS

- [ ] **Step 9: Implement file watcher (stub — full implementation depends on runtime)**

```typescript
// src/lib/persistence/watcher.ts
import { watch } from 'node:fs';
import { join } from 'node:path';

export function watchProject(dir: string, onChange: (filename: string) => void): () => void {
	const watchers = [
		watch(join(dir, 'scenes'), { recursive: false }, (_event, filename) => {
			if (filename) onChange(`scenes/${filename}`);
		}),
		watch(join(dir, 'modules'), { recursive: false }, (_event, filename) => {
			if (filename) onChange(`modules/${filename}`);
		}),
		watch(dir, { recursive: false }, (_event, filename) => {
			if (filename === 'project.json') onChange(filename);
		}),
	];

	return () => watchers.forEach(w => w.close());
}
```

- [ ] **Step 10: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 11: Commit**

```bash
git add src/lib/persistence/ tests/persistence/
git commit -m "feat: add file-based persistence with load, save, and file watcher"
```

---

### Task 6: MCP Server & Tools

**Files:**
- Create: `src/lib/mcp/server.ts`, `src/lib/mcp/tools/read-tools.ts`, `src/lib/mcp/tools/write-tools.ts`, `src/routes/mcp/+server.ts`
- Test: `tests/mcp/tools.test.ts`

- [ ] **Step 1: Write failing test for MCP read tools**

```typescript
// tests/mcp/tools.test.ts
import { describe, it, expect } from 'vitest';
import { createReadToolHandlers } from '$lib/mcp/tools/read-tools.js';
import type { Project, Scene, GameObject } from '$lib/types.js';
import { DEFAULT_CONFIG } from '$lib/constants.js';

function makeTestProject(): Project {
	return {
		name: 'test',
		config: { ...DEFAULT_CONFIG },
		scenes: [{
			id: 's1', name: 'Main', description: 'Main scene',
			objects: [{
				id: 'o1', name: 'player', objType: 'sprite',
				x: 100, y: 200, w: 32, h: 48, color: '#4a7dff',
				visible: true, locked: false, props: { speed: 160 },
			}],
			code: 'class Main extends Phaser.Scene {}',
		}],
		modules: [],
	};
}

describe('read tool handlers', () => {
	it('get_project returns full project', () => {
		const project = makeTestProject();
		const selection = { selectedIds: [] as string[] };
		const handlers = createReadToolHandlers(() => project, () => selection.selectedIds, (id) => project.scenes.flatMap(s => s.objects).find(o => o.id === id));

		const result = handlers.get_project();
		expect(result.name).toBe('test');
		expect(result.scenes).toHaveLength(1);
	});

	it('get_selection returns selected objects', () => {
		const project = makeTestProject();
		const selection = { selectedIds: ['o1'] };
		const handlers = createReadToolHandlers(
			() => project,
			() => selection.selectedIds,
			(id) => project.scenes.flatMap(s => s.objects).find(o => o.id === id),
		);

		const result = handlers.get_selection();
		expect(result.objects).toHaveLength(1);
		expect(result.objects[0].name).toBe('player');
	});

	it('get_object returns object by id', () => {
		const project = makeTestProject();
		const handlers = createReadToolHandlers(
			() => project,
			() => [],
			(id) => project.scenes.flatMap(s => s.objects).find(o => o.id === id),
		);

		const result = handlers.get_object('o1');
		expect(result?.name).toBe('player');
		expect(result?.props.speed).toBe(160);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mcp/tools.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement read-tools**

```typescript
// src/lib/mcp/tools/read-tools.ts
import type { Project, GameObject, Scene } from '$lib/types.js';

export function createReadToolHandlers(
	getProject: () => Project,
	getSelectedIds: () => string[],
	getObject: (id: string) => GameObject | undefined,
) {
	return {
		get_project() {
			const p = getProject();
			return {
				name: p.name,
				config: p.config,
				scenes: p.scenes.map(s => ({
					id: s.id,
					name: s.name,
					description: s.description,
					objectCount: s.objects.length,
				})),
				modules: p.modules.map(m => ({
					id: m.id,
					name: m.name,
					description: m.description,
				})),
			};
		},

		get_scene_tree(sceneId: string) {
			const scene = getProject().scenes.find(s => s.id === sceneId);
			if (!scene) return null;
			return {
				id: scene.id,
				name: scene.name,
				objects: scene.objects.map(o => ({
					id: o.id,
					name: o.name,
					type: o.objType,
					x: o.x, y: o.y, w: o.w, h: o.h,
					visible: o.visible,
					locked: o.locked,
				})),
			};
		},

		get_selection() {
			const ids = getSelectedIds();
			const objects = ids.map(id => getObject(id)).filter(Boolean) as GameObject[];
			return {
				objects: objects.map(o => ({
					id: o.id,
					name: o.name,
					type: o.objType,
					x: o.x, y: o.y, w: o.w, h: o.h,
					props: o.props,
					visible: o.visible,
					locked: o.locked,
				})),
			};
		},

		get_object(objectId: string) {
			return getObject(objectId) ?? null;
		},
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mcp/tools.test.ts`
Expected: PASS

- [ ] **Step 5: Implement write-tools**

```typescript
// src/lib/mcp/tools/write-tools.ts
import type { CommandBus } from '$lib/commands/command-bus.js';
import type { Project, Scene, Module, GameObject } from '$lib/types.js';
import { createUpdateObjectCommand } from '$lib/commands/update-object.js';
import { createAddObjectCommand } from '$lib/commands/add-object.js';
import { createRemoveObjectCommand } from '$lib/commands/remove-object.js';
import { createUpdateCodeCommand } from '$lib/commands/update-code.js';
import { createAddSceneCommand } from '$lib/commands/add-scene.js';
import { createRemoveSceneCommand } from '$lib/commands/remove-scene.js';
import { createUpdateConfigCommand } from '$lib/commands/update-config.js';
import type { ProjectConfig } from '$lib/types.js';

interface StoreAccessors {
	getProject: () => Project;
	getScene: (id: string) => Scene | undefined;
	getObject: (id: string) => GameObject | undefined;
	getObjectScene: (objectId: string) => Scene | undefined;
	getTarget: (id: string) => Scene | Module | undefined;
}

export function createWriteToolHandlers(bus: CommandBus, accessors: StoreAccessors) {
	return {
		update_object(objectId: string, props: Record<string, unknown>) {
			for (const [prop, value] of Object.entries(props)) {
				const cmd = createUpdateObjectCommand(accessors.getObject, objectId, prop, value, 'mcp');
				bus.execute(cmd);
			}
		},

		add_object(sceneId: string, object: GameObject) {
			const cmd = createAddObjectCommand(accessors.getScene, sceneId, object, 'mcp');
			bus.execute(cmd);
		},

		remove_object(objectId: string) {
			const scene = accessors.getObjectScene(objectId);
			if (!scene) throw new Error(`Object ${objectId} not in any scene`);
			const cmd = createRemoveObjectCommand(accessors.getScene, scene.id, objectId, 'mcp');
			bus.execute(cmd);
		},

		update_scene_code(sceneId: string, code: string) {
			const cmd = createUpdateCodeCommand(accessors.getTarget, sceneId, code, 'mcp');
			bus.execute(cmd);
		},

		add_scene(name: string, description: string = '') {
			const scene: Scene = {
				id: crypto.randomUUID(),
				name,
				description,
				objects: [],
				code: `class ${name} extends Phaser.Scene {\n\tconstructor() { super({ key: '${name}' }); }\n\tcreate() {}\n\tupdate() {}\n}`,
			};
			const cmd = createAddSceneCommand(() => accessors.getProject(), scene, 'mcp');
			bus.execute(cmd);
			return scene;
		},

		remove_scene(sceneId: string) {
			const cmd = createRemoveSceneCommand(() => accessors.getProject(), sceneId, 'mcp');
			bus.execute(cmd);
		},

		update_config(props: Partial<ProjectConfig>) {
			for (const [prop, value] of Object.entries(props)) {
				const cmd = createUpdateConfigCommand(
					() => accessors.getProject(),
					prop as keyof ProjectConfig,
					value as ProjectConfig[keyof ProjectConfig],
					'mcp',
				);
				bus.execute(cmd);
			}
		},

		undo() {
			return bus.undo();
		},

		redo() {
			return bus.redo();
		},
	};
}
```

- [ ] **Step 6: Implement MCP server with tool registration**

```typescript
// src/lib/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CommandBus } from '$lib/commands/command-bus.js';
import type { Project, Scene, Module, GameObject } from '$lib/types.js';
import { createReadToolHandlers } from './tools/read-tools.js';
import { createWriteToolHandlers } from './tools/write-tools.js';

interface ServerDeps {
	bus: CommandBus;
	getProject: () => Project;
	getScene: (id: string) => Scene | undefined;
	getObject: (id: string) => GameObject | undefined;
	getObjectScene: (objectId: string) => Scene | undefined;
	getTarget: (id: string) => Scene | Module | undefined;
	getSelectedIds: () => string[];
}

export function createEditorMcpServer(deps: ServerDeps): McpServer {
	const server = new McpServer({ name: 'phaser-editor', version: '1.0.0' });

	const read = createReadToolHandlers(deps.getProject, deps.getSelectedIds, deps.getObject);
	const write = createWriteToolHandlers(deps.bus, {
		getProject: deps.getProject,
		getScene: deps.getScene,
		getObject: deps.getObject,
		getObjectScene: deps.getObjectScene,
		getTarget: deps.getTarget,
	});

	// Read tools
	server.registerTool('get_project', {
		title: 'Get Project',
		description: 'Get full project state: config, scene list, module list',
		inputSchema: z.object({}),
	}, async () => ({
		content: [{ type: 'text', text: JSON.stringify(read.get_project(), null, 2) }],
	}));

	server.registerTool('get_scene_tree', {
		title: 'Get Scene Tree',
		description: 'Get hierarchical scene graph for a given scene',
		inputSchema: z.object({ sceneId: z.string().describe('Scene ID') }),
	}, async ({ sceneId }) => ({
		content: [{ type: 'text', text: JSON.stringify(read.get_scene_tree(sceneId), null, 2) }],
	}));

	server.registerTool('get_selection', {
		title: 'Get Selection',
		description: 'Get currently selected object(s) with full properties',
		inputSchema: z.object({}),
	}, async () => ({
		content: [{ type: 'text', text: JSON.stringify(read.get_selection(), null, 2) }],
	}));

	server.registerTool('get_object', {
		title: 'Get Object',
		description: 'Get detailed properties of a specific object by ID',
		inputSchema: z.object({ objectId: z.string().describe('Object ID') }),
	}, async ({ objectId }) => ({
		content: [{ type: 'text', text: JSON.stringify(read.get_object(objectId), null, 2) }],
	}));

	// Write tools
	server.registerTool('add_object', {
		title: 'Add Object',
		description: 'Add a game object to a scene',
		inputSchema: z.object({
			sceneId: z.string().describe('Scene ID'),
			type: z.string().describe('Object type: sprite, text, rectangle, circle, image, tilemap, group, particles, zone'),
			name: z.string().describe('Object name'),
			x: z.number().describe('X position'),
			y: z.number().describe('Y position'),
			w: z.number().optional().default(32).describe('Width'),
			h: z.number().optional().default(32).describe('Height'),
			props: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().default({}).describe('Custom properties'),
		}),
	}, async ({ sceneId, type, name, x, y, w, h, props }) => {
		const obj: GameObject = {
			id: crypto.randomUUID(),
			name, objType: type, x, y, w, h,
			color: '#ffffff', visible: true, locked: false,
			props: props ?? {},
		};
		write.add_object(sceneId, obj);
		return { content: [{ type: 'text', text: JSON.stringify({ success: true, objectId: obj.id }) }] };
	});

	server.registerTool('update_object', {
		title: 'Update Object',
		description: 'Change one or more properties of an existing object',
		inputSchema: z.object({
			objectId: z.string().describe('Object ID'),
			props: z.record(z.unknown()).describe('Properties to update (e.g. { x: 100, y: 200, name: "new-name" })'),
		}),
	}, async ({ objectId, props }) => {
		write.update_object(objectId, props);
		return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
	});

	server.registerTool('remove_object', {
		title: 'Remove Object',
		description: 'Delete an object by ID',
		inputSchema: z.object({ objectId: z.string().describe('Object ID') }),
	}, async ({ objectId }) => {
		write.remove_object(objectId);
		return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
	});

	server.registerTool('update_scene_code', {
		title: 'Update Scene Code',
		description: 'Replace a scene\'s Phaser class code',
		inputSchema: z.object({
			sceneId: z.string().describe('Scene ID'),
			code: z.string().describe('New Phaser scene class code'),
		}),
	}, async ({ sceneId, code }) => {
		write.update_scene_code(sceneId, code);
		return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
	});

	server.registerTool('add_scene', {
		title: 'Add Scene',
		description: 'Create a new scene',
		inputSchema: z.object({
			name: z.string().describe('Scene name (PascalCase)'),
			description: z.string().optional().default('').describe('Scene description'),
		}),
	}, async ({ name, description }) => {
		const scene = write.add_scene(name, description);
		return { content: [{ type: 'text', text: JSON.stringify({ success: true, sceneId: scene.id }) }] };
	});

	server.registerTool('remove_scene', {
		title: 'Remove Scene',
		description: 'Delete a scene',
		inputSchema: z.object({ sceneId: z.string().describe('Scene ID') }),
	}, async ({ sceneId }) => {
		write.remove_scene(sceneId);
		return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
	});

	server.registerTool('update_config', {
		title: 'Update Config',
		description: 'Change game config (dimensions, physics, background, etc.)',
		inputSchema: z.object({
			props: z.object({
				width: z.number().optional(),
				height: z.number().optional(),
				physics: z.string().optional(),
				pixelArt: z.boolean().optional(),
				backgroundColor: z.string().optional(),
			}).describe('Config properties to update'),
		}),
	}, async ({ props }) => {
		write.update_config(props);
		return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
	});

	// History tools
	server.registerTool('undo', {
		title: 'Undo',
		description: 'Undo the last command',
		inputSchema: z.object({}),
	}, async () => {
		const cmd = write.undo();
		return { content: [{ type: 'text', text: cmd ? `Undone: ${cmd.description}` : 'Nothing to undo' }] };
	});

	server.registerTool('redo', {
		title: 'Redo',
		description: 'Redo the last undone command',
		inputSchema: z.object({}),
	}, async () => {
		const cmd = write.redo();
		return { content: [{ type: 'text', text: cmd ? `Redone: ${cmd.description}` : 'Nothing to redo' }] };
	});

	// Preview tools
	server.registerTool('restart_preview', {
		title: 'Restart Preview',
		description: 'Restart the Phaser game instance',
		inputSchema: z.object({}),
	}, async () => {
		// This will be wired up to the Phaser bridge later
		return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
	});

	return server;
}
```

- [ ] **Step 7: Implement MCP server route**

```typescript
// src/routes/mcp/+server.ts
import type { RequestHandler } from './$types';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getEditorMcpServer } from '$lib/mcp/server.js';

export const POST: RequestHandler = async ({ request }) => {
	const server = getEditorMcpServer();
	const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
	await server.connect(transport);
	return transport.handleRequest(request);
};
```

Note: The `getEditorMcpServer` function will be a singleton that receives the wired-up deps when the app initializes. This will be connected in Task 8 (app wiring).

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/mcp/ src/routes/mcp/ tests/mcp/
git commit -m "feat: add MCP server with 15 tools for AI interaction"
```

---

### Task 7: Editor UI Components (Svelte)

**Files:**
- Create: `src/components/Toolbar.svelte`, `src/components/SceneTree.svelte`, `src/components/PropertiesPanel.svelte`, `src/components/StatusBar.svelte`, `src/components/Modal.svelte`, `src/components/CodeEditor.svelte`, `src/app.css`

- [ ] **Step 1: Create app.css (dark theme)**

```css
/* src/app.css */
:root {
	--bg-primary: #0a0a12;
	--bg-secondary: #16161e;
	--bg-tertiary: #1e1e2e;
	--border: #333;
	--text-primary: #e0e0e0;
	--text-secondary: #999;
	--text-muted: #666;
	--accent-green: #34d399;
	--accent-blue: #60a5fa;
	--accent-yellow: #f59e0b;
	--accent-pink: #f472b6;
	--accent-purple: #a78bfa;
	--accent-red: #ef4444;
	--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
	font-family: var(--font-mono);
	background: var(--bg-primary);
	color: var(--text-primary);
	overflow: hidden;
	height: 100vh;
}

.editor-layout {
	display: grid;
	grid-template-rows: 40px 1fr 24px;
	grid-template-columns: 220px 1fr 260px;
	height: 100vh;
}

.toolbar { grid-column: 1 / -1; }
.scene-tree { grid-row: 2; grid-column: 1; }
.center-panel { grid-row: 2; grid-column: 2; }
.properties-panel { grid-row: 2; grid-column: 3; }
.status-bar { grid-column: 1 / -1; }

.panel {
	background: var(--bg-secondary);
	border: 1px solid var(--border);
	overflow-y: auto;
}

.panel-header {
	font-size: 10px;
	font-weight: bold;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	padding: 8px;
	color: var(--text-muted);
}

button {
	background: var(--bg-tertiary);
	color: var(--text-primary);
	border: 1px solid var(--border);
	padding: 4px 10px;
	border-radius: 4px;
	font-family: var(--font-mono);
	font-size: 11px;
	cursor: pointer;
}

button:hover { background: #2a2a3a; }
button.active { background: #059669; border-color: #059669; }
button:disabled { opacity: 0.4; cursor: not-allowed; }

input, select {
	background: var(--bg-tertiary);
	color: var(--text-primary);
	border: 1px solid var(--border);
	padding: 2px 6px;
	border-radius: 3px;
	font-family: var(--font-mono);
	font-size: 11px;
}
```

- [ ] **Step 2: Create Toolbar.svelte**

```svelte
<!-- src/components/Toolbar.svelte -->
<script lang="ts">
	import type { ViewMode } from '$lib/types.js';

	let {
		projectName = '',
		viewMode = $bindable<ViewMode>('edit'),
		canUndo = false,
		canRedo = false,
		mcpConnected = false,
		onUndo,
		onRedo,
	}: {
		projectName: string;
		viewMode: ViewMode;
		canUndo: boolean;
		canRedo: boolean;
		mcpConnected: boolean;
		onUndo: () => void;
		onRedo: () => void;
	} = $props();
</script>

<div class="toolbar" style="display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:var(--bg-tertiary);border-bottom:1px solid var(--border);">
	<div style="display:flex;gap:16px;align-items:center;">
		<span style="color:var(--accent-green);font-weight:bold;">⬡ Phaser Editor</span>
		<span style="color:var(--text-secondary);">{projectName}</span>
	</div>
	<div style="display:flex;gap:4px;">
		<button class:active={viewMode === 'edit'} onclick={() => viewMode = 'edit'}>EDIT</button>
		<button class:active={viewMode === 'play'} onclick={() => viewMode = 'play'}>PLAY</button>
		<button class:active={viewMode === 'code'} onclick={() => viewMode = 'code'}>CODE</button>
	</div>
	<div style="display:flex;gap:12px;align-items:center;">
		<button disabled={!canUndo} onclick={onUndo}>↩ Undo</button>
		<button disabled={!canRedo} onclick={onRedo}>↪ Redo</button>
		<span style="font-size:10px;color:{mcpConnected ? 'var(--accent-green)' : 'var(--text-muted)'};">
			● {mcpConnected ? 'MCP Connected' : 'MCP Disconnected'}
		</span>
	</div>
</div>
```

- [ ] **Step 3: Create SceneTree.svelte**

```svelte
<!-- src/components/SceneTree.svelte -->
<script lang="ts">
	import type { Project, Scene, Module } from '$lib/types.js';
	import { OBJ_TYPES } from '$lib/constants.js';

	let {
		project,
		activeSceneId = '',
		selectedObjectIds = [] as string[],
		onSelectScene,
		onSelectObject,
	}: {
		project: Project;
		activeSceneId: string;
		selectedObjectIds: string[];
		onSelectScene: (id: string) => void;
		onSelectObject: (id: string) => void;
	} = $props();
</script>

<div class="panel scene-tree">
	<div class="panel-header" style="color:var(--accent-blue);">Scenes</div>
	{#each project.scenes as scene}
		<div
			style="padding:4px 8px;cursor:pointer;{scene.id === activeSceneId ? 'background:#1e3a5f;color:#ccc;' : 'color:var(--text-secondary);'}"
			onclick={() => onSelectScene(scene.id)}
		>
			▾ {scene.name}
		</div>
		{#if scene.id === activeSceneId}
			{#each scene.objects as obj}
				<div
					style="padding:4px 16px;font-size:10px;cursor:pointer;{selectedObjectIds.includes(obj.id) ? 'background:#2d2d3d;' : ''}"
					onclick={() => onSelectObject(obj.id)}
				>
					<span style="color:{OBJ_TYPES[obj.objType]?.color ?? '#999'};">{OBJ_TYPES[obj.objType]?.icon ?? '?'}</span>
					{obj.name}
				</div>
			{/each}
		{/if}
	{/each}

	<div class="panel-header" style="color:var(--accent-yellow);margin-top:16px;">Modules</div>
	{#each project.modules as mod}
		<div style="padding:4px 8px;color:var(--text-secondary);cursor:pointer;">
			{mod.name}
		</div>
	{/each}
</div>
```

- [ ] **Step 4: Create PropertiesPanel.svelte**

```svelte
<!-- src/components/PropertiesPanel.svelte -->
<script lang="ts">
	import type { GameObject } from '$lib/types.js';
	import { OBJ_TYPES } from '$lib/constants.js';

	let {
		selectedObject = null as GameObject | null,
		onUpdateProperty,
	}: {
		selectedObject: GameObject | null;
		onUpdateProperty: (objectId: string, prop: string, value: unknown) => void;
	} = $props();

	function handleChange(prop: string, event: Event) {
		if (!selectedObject) return;
		const target = event.target as HTMLInputElement;
		const value = target.type === 'number' ? Number(target.value) : target.value;
		onUpdateProperty(selectedObject.id, prop, value);
	}
</script>

<div class="panel properties-panel">
	<div class="panel-header" style="color:var(--accent-pink);">Properties</div>

	{#if selectedObject}
		<div style="padding:8px;">
			<div style="color:var(--accent-blue);margin-bottom:12px;">
				{selectedObject.name}
				<span style="color:var(--text-muted);font-size:10px;">{OBJ_TYPES[selectedObject.objType]?.label}</span>
			</div>

			<div style="color:var(--text-muted);font-size:9px;margin-bottom:4px;">TRANSFORM</div>
			<div style="display:grid;grid-template-columns:40px 1fr;gap:4px;font-size:10px;margin-bottom:12px;">
				{#each ['x', 'y', 'w', 'h'] as prop}
					<span style="color:var(--text-secondary);">{prop}</span>
					<input type="number" value={selectedObject[prop]} onchange={(e) => handleChange(prop, e)} />
				{/each}
			</div>

			<div style="color:var(--text-muted);font-size:9px;margin-bottom:4px;">APPEARANCE</div>
			<div style="display:grid;grid-template-columns:40px 1fr;gap:4px;font-size:10px;margin-bottom:12px;">
				<span style="color:var(--text-secondary);">color</span>
				<input type="text" value={selectedObject.color} onchange={(e) => handleChange('color', e)} />
				<span style="color:var(--text-secondary);">visible</span>
				<input type="checkbox" checked={selectedObject.visible} onchange={(e) => handleChange('visible', (e.target as HTMLInputElement).checked)} />
			</div>

			{#if Object.keys(selectedObject.props).length > 0}
				<div style="color:var(--text-muted);font-size:9px;margin-bottom:4px;">CUSTOM</div>
				<div style="display:grid;grid-template-columns:60px 1fr;gap:4px;font-size:10px;">
					{#each Object.entries(selectedObject.props) as [key, value]}
						<span style="color:var(--text-secondary);">{key}</span>
						<input type="text" value={String(value)} onchange={(e) => onUpdateProperty(selectedObject.id, key, (e.target as HTMLInputElement).value)} />
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div style="padding:16px;color:var(--text-muted);font-size:11px;">No object selected</div>
	{/if}
</div>
```

- [ ] **Step 5: Create StatusBar.svelte**

```svelte
<!-- src/components/StatusBar.svelte -->
<script lang="ts">
	let {
		sceneName = '',
		objectCount = 0,
		config = { width: 0, height: 0, physics: '' },
		historyDepth = 0,
		saved = true,
	}: {
		sceneName: string;
		objectCount: number;
		config: { width: number; height: number; physics: string };
		historyDepth: number;
		saved: boolean;
	} = $props();
</script>

<div class="status-bar" style="display:flex;justify-content:space-between;align-items:center;padding:0 16px;background:var(--bg-tertiary);border-top:1px solid var(--border);font-size:10px;color:var(--text-muted);">
	<span>{sceneName} — {objectCount} objects</span>
	<span>{config.width}×{config.height} | {config.physics} physics</span>
	<span>History: {historyDepth} commands | {saved ? 'Saved ✓' : 'Unsaved'}</span>
</div>
```

- [ ] **Step 6: Create Modal.svelte (stub)**

```svelte
<!-- src/components/Modal.svelte -->
<script lang="ts">
	let {
		open = false,
		title = '',
		onConfirm,
		onCancel,
		children,
	}: {
		open: boolean;
		title: string;
		onConfirm: () => void;
		onCancel: () => void;
		children: any;
	} = $props();
</script>

{#if open}
	<div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:100;">
		<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:24px;min-width:300px;">
			<h3 style="margin-bottom:16px;font-size:14px;">{title}</h3>
			{@render children()}
			<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
				<button onclick={onCancel}>Cancel</button>
				<button class="active" onclick={onConfirm}>Confirm</button>
			</div>
		</div>
	</div>
{/if}
```

- [ ] **Step 7: Verify dev server runs with components**

Run: `npm run dev`
Expected: No compilation errors. (Components aren't wired into the page yet — that's Task 8.)

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/app.css
git commit -m "feat: add editor UI components — toolbar, scene tree, properties, status bar"
```

---

### Task 8: Phaser Embedding & Selection Overlay

**Files:**
- Create: `src/components/PhaserCanvas.svelte`, `src/components/SelectionOverlay.svelte`, `src/lib/phaser/bridge.ts`, `src/lib/phaser/transpile.ts`

- [ ] **Step 1: Implement transpile utility**

```typescript
// src/lib/phaser/transpile.ts
import { transform } from 'esbuild';

export async function transpileTS(code: string): Promise<string> {
	const result = await transform(code, {
		loader: 'ts',
		target: 'es2020',
	});
	return result.code;
}
```

- [ ] **Step 2: Implement Phaser bridge**

```typescript
// src/lib/phaser/bridge.ts
import Phaser from 'phaser';
import type { Scene, GameObject } from '$lib/types.js';

export function createPhaserBridge(container: HTMLElement, config: {
	width: number;
	height: number;
	backgroundColor: string;
	physics: string;
	pixelArt: boolean;
}) {
	let game: Phaser.Game | null = null;

	function start() {
		if (game) game.destroy(true);
		game = new Phaser.Game({
			type: Phaser.AUTO,
			parent: container,
			width: config.width,
			height: config.height,
			backgroundColor: config.backgroundColor,
			pixelArt: config.pixelArt,
			physics: {
				default: config.physics,
				arcade: { gravity: { x: 0, y: 300 }, debug: false },
			},
			scene: {
				create() {
					// Empty scene — objects are added by the bridge
				},
			},
		});
	}

	function syncObjects(objects: GameObject[]) {
		if (!game || !game.scene.scenes[0]) return;
		const scene = game.scene.scenes[0];

		// Simple approach: clear and recreate
		// A production version would diff and update
		scene.children.removeAll(true);

		for (const obj of objects) {
			if (!obj.visible) continue;
			switch (obj.objType) {
				case 'rectangle':
					scene.add.rectangle(obj.x, obj.y, obj.w, obj.h, parseInt(obj.color.replace('#', ''), 16));
					break;
				case 'circle':
					scene.add.circle(obj.x, obj.y, obj.w / 2, parseInt(obj.color.replace('#', ''), 16));
					break;
				case 'text':
					scene.add.text(obj.x, obj.y, String(obj.props.text ?? obj.name), {
						fontSize: String(obj.props.fontSize ?? '16px'),
						color: obj.color,
					});
					break;
				default:
					// Fallback: render as colored rectangle
					scene.add.rectangle(obj.x, obj.y, obj.w, obj.h, parseInt(obj.color.replace('#', ''), 16));
					break;
			}
		}
	}

	function getCanvas(): HTMLCanvasElement | null {
		return container.querySelector('canvas');
	}

	function destroy() {
		if (game) {
			game.destroy(true);
			game = null;
		}
	}

	function restart() {
		destroy();
		start();
	}

	return { start, syncObjects, getCanvas, destroy, restart };
}

export type PhaserBridge = ReturnType<typeof createPhaserBridge>;
```

- [ ] **Step 3: Create PhaserCanvas.svelte**

```svelte
<!-- src/components/PhaserCanvas.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createPhaserBridge, type PhaserBridge } from '$lib/phaser/bridge.js';
	import type { ProjectConfig, GameObject } from '$lib/types.js';

	let {
		config,
		objects = [] as GameObject[],
		viewMode = 'edit',
	}: {
		config: ProjectConfig;
		objects: GameObject[];
		viewMode: string;
	} = $props();

	let container: HTMLDivElement;
	let bridge: PhaserBridge | null = null;

	onMount(() => {
		bridge = createPhaserBridge(container, config);
		bridge.start();
	});

	onDestroy(() => {
		bridge?.destroy();
	});

	$effect(() => {
		bridge?.syncObjects(objects);
	});
</script>

<div style="position:relative;flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);">
	<div bind:this={container} style="position:relative;"></div>
</div>
```

- [ ] **Step 4: Create SelectionOverlay.svelte**

```svelte
<!-- src/components/SelectionOverlay.svelte -->
<script lang="ts">
	import type { GameObject } from '$lib/types.js';

	let {
		objects = [] as GameObject[],
		selectedIds = [] as string[],
		canvasRect = { left: 0, top: 0, width: 800, height: 600 },
		onSelect,
		onMove,
	}: {
		objects: GameObject[];
		selectedIds: string[];
		canvasRect: { left: number; top: number; width: number; height: number };
		onSelect: (id: string, multi: boolean) => void;
		onMove: (id: string, x: number, y: number) => void;
	} = $props();

	let dragging: { id: string; startX: number; startY: number; origX: number; origY: number } | null = $state(null);

	function handlePointerDown(e: PointerEvent, obj: GameObject) {
		e.stopPropagation();
		onSelect(obj.id, e.shiftKey);
		dragging = { id: obj.id, startX: e.clientX, startY: e.clientY, origX: obj.x, origY: obj.y };
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		const dx = e.clientX - dragging.startX;
		const dy = e.clientY - dragging.startY;
		onMove(dragging.id, dragging.origX + dx, dragging.origY + dy);
	}

	function handlePointerUp() {
		dragging = null;
	}

	function handleBackgroundClick() {
		onSelect('', false);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	style="position:absolute;inset:0;pointer-events:auto;cursor:default;"
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onclick={handleBackgroundClick}
>
	{#each objects as obj}
		{#if obj.visible && !obj.locked}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				style="position:absolute;left:{obj.x - obj.w/2}px;top:{obj.y - obj.h/2}px;width:{obj.w}px;height:{obj.h}px;cursor:move;"
				onpointerdown={(e) => handlePointerDown(e, obj)}
			>
				{#if selectedIds.includes(obj.id)}
					<div style="position:absolute;inset:-2px;border:2px solid var(--accent-blue);border-radius:2px;pointer-events:none;">
						{#each [['top','left'],['top','right'],['bottom','left'],['bottom','right']] as [v,h]}
							<div style="position:absolute;{v}:-3px;{h}:-3px;width:6px;height:6px;background:var(--accent-blue);"></div>
						{/each}
					</div>
					<div style="position:absolute;top:-16px;left:0;color:var(--accent-blue);font-size:9px;white-space:nowrap;font-family:var(--font-mono);">{obj.name}</div>
				{/if}
			</div>
		{/if}
	{/each}
</div>
```

- [ ] **Step 5: Verify dev server compiles**

Run: `npm run dev`
Expected: No compilation errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/PhaserCanvas.svelte src/components/SelectionOverlay.svelte src/lib/phaser/
git commit -m "feat: add embedded Phaser canvas with selection overlay and bridge"
```

---

### Task 9: Wire Everything Together — Main Page

**Files:**
- Modify: `src/routes/+page.svelte`
- Create: `src/routes/api/project/+server.ts`

- [ ] **Step 1: Create project API route**

```typescript
// src/routes/api/project/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { loadProject } from '$lib/persistence/load-project.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	const projectDir = env.PHASER_PROJECT_DIR || './sample-project';
	try {
		const project = await loadProject(projectDir);
		return json(project);
	} catch (e) {
		return json({
			name: 'new-project',
			config: { width: 800, height: 600, physics: 'arcade', pixelArt: false, backgroundColor: '#1a1a2e' },
			scenes: [],
			modules: [],
		});
	}
};
```

- [ ] **Step 2: Wire up +page.svelte**

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { ViewMode, GameObject } from '$lib/types.js';
	import { projectStore } from '$lib/stores/project.svelte.js';
	import { selectionStore } from '$lib/stores/selection.svelte.js';
	import { historyStore } from '$lib/stores/history.svelte.js';
	import { createCommandBus } from '$lib/commands/command-bus.js';
	import { createUpdateObjectCommand } from '$lib/commands/update-object.js';
	import Toolbar from '../components/Toolbar.svelte';
	import SceneTree from '../components/SceneTree.svelte';
	import PhaserCanvas from '../components/PhaserCanvas.svelte';
	import SelectionOverlay from '../components/SelectionOverlay.svelte';
	import PropertiesPanel from '../components/PropertiesPanel.svelte';
	import StatusBar from '../components/StatusBar.svelte';

	const store = projectStore();
	const selection = selectionStore();
	const history = historyStore();
	const bus = createCommandBus(history);

	let viewMode = $state<ViewMode>('edit');
	let activeSceneId = $state('');
	let mcpConnected = $state(false);

	let activeScene = $derived(store.getScene(activeSceneId));
	let selectedObject = $derived(
		selection.selectedIds.length === 1
			? store.getObject(selection.selectedIds[0]) ?? null
			: null
	);

	onMount(async () => {
		const res = await fetch('/api/project');
		const project = await res.json();
		store.load(project);
		if (project.scenes.length > 0) {
			activeSceneId = project.scenes[0].id;
		}
	});

	function handleSelectScene(id: string) {
		activeSceneId = id;
		selection.clear();
	}

	function handleSelectObject(id: string, multi = false) {
		if (!id) { selection.clear(); return; }
		if (multi) { selection.toggleSelect(id); }
		else { selection.select(id); }
	}

	function handleMoveObject(id: string, x: number, y: number) {
		const cmd = createUpdateObjectCommand(store.getObject.bind(store), id, 'x', Math.round(x), 'user');
		bus.execute(cmd);
		const cmd2 = createUpdateObjectCommand(store.getObject.bind(store), id, 'y', Math.round(y), 'user');
		bus.execute(cmd2);
	}

	function handleUpdateProperty(objectId: string, prop: string, value: unknown) {
		const cmd = createUpdateObjectCommand(store.getObject.bind(store), objectId, prop, value, 'user');
		bus.execute(cmd);
	}
</script>

<div class="editor-layout">
	<Toolbar
		projectName={store.project.name}
		bind:viewMode
		canUndo={history.canUndo}
		canRedo={history.canRedo}
		{mcpConnected}
		onUndo={() => bus.undo()}
		onRedo={() => bus.redo()}
	/>

	<SceneTree
		project={store.project}
		{activeSceneId}
		selectedObjectIds={selection.selectedIds}
		onSelectScene={handleSelectScene}
		onSelectObject={(id) => handleSelectObject(id)}
	/>

	<div class="center-panel" style="position:relative;overflow:hidden;">
		{#if viewMode === 'edit' && activeScene}
			<PhaserCanvas config={store.project.config} objects={activeScene.objects} {viewMode} />
			<SelectionOverlay
				objects={activeScene.objects}
				selectedIds={selection.selectedIds}
				canvasRect={{ left: 0, top: 0, width: store.project.config.width, height: store.project.config.height }}
				onSelect={handleSelectObject}
				onMove={handleMoveObject}
			/>
		{:else if viewMode === 'code' && activeScene}
			<div style="padding:16px;color:var(--text-secondary);">Code editor placeholder — will use CodeMirror</div>
		{:else if viewMode === 'play'}
			<div style="padding:16px;color:var(--text-secondary);">Play mode — full Phaser game</div>
		{:else}
			<div style="padding:16px;color:var(--text-muted);">No scene selected</div>
		{/if}
	</div>

	<PropertiesPanel
		{selectedObject}
		onUpdateProperty={handleUpdateProperty}
	/>

	<StatusBar
		sceneName={activeScene?.name ?? ''}
		objectCount={activeScene?.objects.length ?? 0}
		config={store.project.config}
		historyDepth={history.depth}
		saved={true}
	/>
</div>
```

- [ ] **Step 3: Create a sample project directory for testing**

```bash
mkdir -p sample-project/scenes sample-project/modules
```

Write `sample-project/project.json`:
```json
{
  "name": "sample-game",
  "config": { "width": 800, "height": 600, "physics": "arcade", "pixelArt": false, "backgroundColor": "#1a1a2e" },
  "scenes": ["MainScene"],
  "modules": []
}
```

Write `sample-project/scenes/MainScene.json`:
```json
{
  "id": "s1",
  "name": "MainScene",
  "description": "Main game scene",
  "objects": [
    { "id": "o1", "name": "platform", "objType": "rectangle", "x": 400, "y": 500, "w": 600, "h": 32, "color": "#78716c", "visible": true, "locked": false, "props": {} },
    { "id": "o2", "name": "player", "objType": "rectangle", "x": 100, "y": 400, "w": 32, "h": 48, "color": "#4ade80", "visible": true, "locked": false, "props": {} }
  ]
}
```

Write `sample-project/scenes/MainScene.ts`:
```typescript
class MainScene extends Phaser.Scene {
	constructor() { super({ key: 'MainScene' }); }
	create() {}
	update() {}
}
```

- [ ] **Step 4: Run and verify the full editor loads**

Run: `PHASER_PROJECT_DIR=./sample-project npm run dev`
Expected: Editor loads with three-panel layout, scene tree shows MainScene with platform and player, clicking objects shows properties in the right panel.

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/routes/ sample-project/
git commit -m "feat: wire up main editor page with stores, commands, and sample project"
```

---

### Task 10: CodeMirror Integration

**Files:**
- Create: `src/components/CodeEditor.svelte`

- [ ] **Step 1: Create CodeEditor.svelte**

```svelte
<!-- src/components/CodeEditor.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { javascript } from '@codemirror/lang-javascript';
	import { EditorState } from '@codemirror/state';
	import { oneDark } from '@codemirror/theme-one-dark';

	let {
		code = '',
		onCodeChange,
	}: {
		code: string;
		onCodeChange: (newCode: string) => void;
	} = $props();

	let container: HTMLDivElement;
	let view: EditorView | null = null;

	onMount(() => {
		const state = EditorState.create({
			doc: code,
			extensions: [
				basicSetup,
				javascript({ typescript: true }),
				oneDark,
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						onCodeChange(update.state.doc.toString());
					}
				}),
			],
		});
		view = new EditorView({ state, parent: container });
	});

	onDestroy(() => {
		view?.destroy();
	});

	$effect(() => {
		if (view && code !== view.state.doc.toString()) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: code },
			});
		}
	});
</script>

<div bind:this={container} style="height:100%;overflow:auto;"></div>
```

- [ ] **Step 2: Wire CodeEditor into +page.svelte**

In the center panel's code mode section, replace the placeholder with:

```svelte
{:else if viewMode === 'code' && activeScene}
	<CodeEditor
		code={activeScene.code}
		onCodeChange={(newCode) => {
			if (activeScene) {
				const cmd = createUpdateCodeCommand(
					(id) => store.getScene(id) ?? store.getModule(id),
					activeScene.id,
					newCode,
					'user'
				);
				bus.execute(cmd);
			}
		}}
	/>
```

Add the import at the top:
```typescript
import CodeEditor from '../components/CodeEditor.svelte';
import { createUpdateCodeCommand } from '$lib/commands/update-code.js';
```

- [ ] **Step 3: Verify code editing works**

Run: `npm run dev`
Expected: Switch to CODE mode, see CodeMirror with scene code, edits create undo-able commands.

- [ ] **Step 4: Commit**

```bash
git add src/components/CodeEditor.svelte src/routes/+page.svelte
git commit -m "feat: add CodeMirror editor with undo-able code commands"
```

---

### Task 11: Connect MCP Server to App State

**Files:**
- Modify: `src/lib/mcp/server.ts`, `src/routes/mcp/+server.ts`

- [ ] **Step 1: Create a singleton MCP server connected to app state**

Add to `src/lib/mcp/server.ts` a `getEditorMcpServer()` singleton function that creates the server once and wires it to the global stores. Since stores live on the server side in SvelteKit SSR context, they need to be initialized at server startup.

```typescript
// Add to the end of src/lib/mcp/server.ts

let singleton: McpServer | null = null;
let singletonDeps: ServerDeps | null = null;

export function initEditorMcpServer(deps: ServerDeps): McpServer {
	singleton = createEditorMcpServer(deps);
	singletonDeps = deps;
	return singleton;
}

export function getEditorMcpServer(): McpServer {
	if (!singleton) throw new Error('MCP server not initialized — call initEditorMcpServer first');
	return singleton;
}
```

- [ ] **Step 2: Create server initialization hook**

```typescript
// src/hooks.server.ts
import { initEditorMcpServer } from '$lib/mcp/server.js';
import { projectStore } from '$lib/stores/project.svelte.js';
import { selectionStore } from '$lib/stores/selection.svelte.js';
import { historyStore } from '$lib/stores/history.svelte.js';
import { createCommandBus } from '$lib/commands/command-bus.js';
import { loadProject } from '$lib/persistence/load-project.js';
import { debouncedSave } from '$lib/persistence/save-project.js';
import { env } from '$env/dynamic/private';

const store = projectStore();
const selection = selectionStore();
const history = historyStore();
const bus = createCommandBus(history);

const projectDir = env.PHASER_PROJECT_DIR || './sample-project';

// Load project on startup
loadProject(projectDir).then(project => {
	store.load(project);
}).catch(() => {
	console.warn('No project found at', projectDir, '— starting empty');
});

// Persist on every command
bus.onExecute(() => {
	debouncedSave(projectDir, store.project);
});

// Initialize MCP server
initEditorMcpServer({
	bus,
	getProject: () => store.project,
	getScene: (id) => store.getScene(id),
	getObject: (id) => store.getObject(id),
	getObjectScene: (id) => store.getObjectScene(id),
	getTarget: (id) => store.getScene(id) ?? store.getModule(id),
	getSelectedIds: () => selection.selectedIds,
});

export const handle = async ({ event, resolve }) => {
	return resolve(event);
};
```

- [ ] **Step 3: Update MCP route to use singleton**

The `/mcp` route already imports `getEditorMcpServer` — verify it works now that the hook initializes it.

- [ ] **Step 4: Test MCP connection manually**

Run: `PHASER_PROJECT_DIR=./sample-project npm run dev`

Test with curl:
```bash
curl -X POST http://localhost:5173/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

Expected: JSON response listing all 15 registered tools.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mcp/server.ts src/hooks.server.ts src/routes/mcp/+server.ts
git commit -m "feat: connect MCP server to app state via server hooks"
```

---

### Task 12: End-to-End Smoke Test

**Files:**
- No new files — verification task

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 2: Start dev server and verify editor loads**

Run: `PHASER_PROJECT_DIR=./sample-project npm run dev`
Expected: Editor loads with sample project. Scene tree, canvas, and properties panel all render.

- [ ] **Step 3: Verify MCP tools work**

Test `get_project` via Claude Code by adding to `.claude/settings.local.json`:
```json
{
  "mcpServers": {
    "phaser-editor": {
      "url": "http://localhost:5173/mcp"
    }
  }
}
```

Then test from Claude Code: use the `get_project` tool and verify it returns the sample project data.

- [ ] **Step 4: Verify undo/redo**

In the editor: select an object, change a property in the properties panel, click Undo — property should revert.

- [ ] **Step 5: Verify persistence**

After making changes, check `sample-project/scenes/MainScene.json` — it should reflect the changes after the debounce delay.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete AI-driven Phaser editor v1 — SvelteKit, MCP, undo/redo, persistence"
```

---

## Summary

| Task | Description | Est. Steps |
|------|-------------|-----------|
| 1 | Scaffold SvelteKit project | 9 |
| 2 | Types & constants | 3 |
| 3 | Svelte stores (project, selection, history) | 10 |
| 4 | Command system | 19 |
| 5 | File-based persistence | 11 |
| 6 | MCP server & tools | 9 |
| 7 | Editor UI components | 8 |
| 8 | Phaser embedding & selection overlay | 6 |
| 9 | Wire everything together | 6 |
| 10 | CodeMirror integration | 4 |
| 11 | Connect MCP to app state | 5 |
| 12 | End-to-end smoke test | 6 |
| **Total** | | **96** |
