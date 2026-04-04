/**
 * Integration smoke tests — verify key workflows end-to-end
 * without browser/Phaser (pure TypeScript paths only).
 */
import { describe, it, expect } from 'vitest';
import type { Project, Scene, GameObject, Asset, Command } from '$lib/types.js';
import { DEFAULT_CONFIG } from '$lib/constants.js';
import { createCommandBus } from '$lib/commands/command-bus.js';
import { createAddObjectCommand } from '$lib/commands/add-object.js';
import { createRemoveObjectCommand } from '$lib/commands/remove-object.js';
import { createUpdateObjectCommand } from '$lib/commands/update-object.js';
import { createAddAssetCommand } from '$lib/commands/add-asset.js';
import { createRemoveAssetCommand } from '$lib/commands/remove-asset.js';
import { createAddSceneCommand } from '$lib/commands/add-scene.js';
import { createRemoveSceneCommand } from '$lib/commands/remove-scene.js';
import { createUpdateCodeCommand } from '$lib/commands/update-code.js';
import { createUpdateConfigCommand } from '$lib/commands/update-config.js';
import { generateExportFiles } from '$lib/export/generate-project.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHistory() {
	const stack: Command[] = [];
	let cursor = 0;
	return {
		execute(cmd: Command) { cmd.execute(); stack.splice(cursor); stack.push(cmd); cursor = stack.length; },
		undo() { if (cursor <= 0) return undefined; cursor--; const cmd = stack[cursor]; cmd.undo(); return cmd; },
		redo() { if (cursor >= stack.length) return undefined; const cmd = stack[cursor]; cmd.execute(); cursor++; return cmd; },
	};
}

function makeProject(): Project {
	return {
		name: 'SmokeTest',
		config: { ...DEFAULT_CONFIG },
		scenes: [{
			id: 's1', name: 'Main', description: 'Main scene', objects: [], code: '',
		}],
		modules: [],
		assets: [],
	};
}

function makeObj(id: string, name: string): GameObject {
	return { id, name, objType: 'rectangle', x: 0, y: 0, w: 50, h: 50, color: '#ff0000', visible: true, locked: false, props: {} };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Smoke: Command bus + undo/redo lifecycle', () => {
	it('executes commands, undoes, and redoes correctly across multiple types', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);
		const getScene = (id: string) => project.scenes.find(s => s.id === id);
		const getObject = (id: string) => project.scenes.flatMap(s => s.objects).find(o => o.id === id);

		// Add two objects
		bus.execute(createAddObjectCommand(getScene, 's1', makeObj('o1', 'Player'), 'user'));
		bus.execute(createAddObjectCommand(getScene, 's1', makeObj('o2', 'Enemy'), 'user'));
		expect(project.scenes[0].objects).toHaveLength(2);

		// Update one
		bus.execute(createUpdateObjectCommand(getObject, 'o1', 'x', 200, 'user'));
		expect(getObject('o1')!.x).toBe(200);

		// Undo the update
		bus.undo();
		expect(getObject('o1')!.x).toBe(0);

		// Undo the second add
		bus.undo();
		expect(project.scenes[0].objects).toHaveLength(1);
		expect(project.scenes[0].objects[0].name).toBe('Player');

		// Redo brings Enemy back
		bus.redo();
		expect(project.scenes[0].objects).toHaveLength(2);

		// Remove Player
		bus.execute(createRemoveObjectCommand(getScene, 's1', 'o1', 'user'));
		expect(project.scenes[0].objects).toHaveLength(1);
		expect(project.scenes[0].objects[0].name).toBe('Enemy');

		// Undo the remove
		bus.undo();
		expect(project.scenes[0].objects).toHaveLength(2);
	});
});

describe('Smoke: Asset lifecycle', () => {
	it('adds, uses, and removes assets with undo', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);

		const asset: Asset = { id: 'a1', key: 'hero', filename: 'hero.png', type: 'image' };
		bus.execute(createAddAssetCommand(() => project, asset, 'user'));
		expect(project.assets).toHaveLength(1);

		// Add sprite using the asset
		const getScene = (id: string) => project.scenes.find(s => s.id === id);
		const sprite: GameObject = {
			id: 'o1', name: 'hero_sprite', objType: 'sprite',
			x: 100, y: 200, w: 32, h: 32, color: '#4a7dff',
			visible: true, locked: false, props: { assetKey: 'hero' },
		};
		bus.execute(createAddObjectCommand(getScene, 's1', sprite, 'user'));
		expect(project.scenes[0].objects[0].props.assetKey).toBe('hero');

		// Remove asset
		bus.execute(createRemoveAssetCommand(() => project, 'a1', 'user'));
		expect(project.assets).toHaveLength(0);

		// Undo restores asset
		bus.undo();
		expect(project.assets).toHaveLength(1);
		expect(project.assets[0].key).toBe('hero');
	});
});

describe('Smoke: Scene management', () => {
	it('adds and removes scenes with undo', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);

		const newScene: Scene = {
			id: 's2', name: 'Level2', description: 'Second level',
			objects: [], code: 'class Level2 extends Phaser.Scene {}',
		};
		bus.execute(createAddSceneCommand(() => project, newScene, 'user'));
		expect(project.scenes).toHaveLength(2);

		bus.execute(createRemoveSceneCommand(() => project, 's2', 'user'));
		expect(project.scenes).toHaveLength(1);

		bus.undo();
		expect(project.scenes).toHaveLength(2);
		expect(project.scenes[1].name).toBe('Level2');
	});
});

describe('Smoke: Code and config updates', () => {
	it('updates scene code and project config with undo', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);
		const getTarget = (id: string) => project.scenes.find(s => s.id === id);

		bus.execute(createUpdateCodeCommand(getTarget, 's1', 'class Main extends Phaser.Scene {}', 'user'));
		expect(project.scenes[0].code).toBe('class Main extends Phaser.Scene {}');

		bus.undo();
		expect(project.scenes[0].code).toBe('');

		bus.execute(createUpdateConfigCommand(() => project, 'width', 1024, 'user'));
		expect(project.config.width).toBe(1024);

		bus.undo();
		expect(project.config.width).toBe(DEFAULT_CONFIG.width);
	});
});

describe('Smoke: Export generates valid project structure', () => {
	it('exports a project with objects and assets', () => {
		const project: Project = {
			name: 'ExportTest',
			config: { ...DEFAULT_CONFIG },
			scenes: [{
				id: 's1', name: 'GameScene', description: '', code: '',
				objects: [
					{ id: 'o1', name: 'bg', objType: 'rectangle', x: 400, y: 300, w: 800, h: 600, color: '#333', visible: true, locked: false, props: {} },
					{ id: 'o2', name: 'hero', objType: 'sprite', x: 100, y: 200, w: 32, h: 48, color: '#0f0', visible: true, locked: false, props: { assetKey: 'player' } },
				],
			}],
			modules: [{ id: 'm1', name: 'Utils', description: '', code: 'export const PI = 3.14;' }],
			assets: [{ id: 'a1', key: 'player', filename: 'player.png', type: 'image' }],
		};

		const files = generateExportFiles(project);
		const paths = files.map(f => f.path);

		// All expected files present
		expect(paths).toContain('package.json');
		expect(paths).toContain('index.html');
		expect(paths).toContain('src/main.ts');
		expect(paths).toContain('src/scenes/GameScene.ts');
		expect(paths).toContain('src/modules/Utils.ts');

		// Main imports the scene
		const main = files.find(f => f.path === 'src/main.ts')!.content;
		expect(main).toContain('import { GameScene }');
		expect(main).toContain('scene: [GameScene]');

		// Scene preloads asset and creates objects
		const scene = files.find(f => f.path === 'src/scenes/GameScene.ts')!.content;
		expect(scene).toContain("this.load.image('player'");
		expect(scene).toContain("this.add.rectangle(400, 300");
		expect(scene).toContain("this.add.image(100, 200, 'player')");

		// Module code is preserved
		const mod = files.find(f => f.path === 'src/modules/Utils.ts')!.content;
		expect(mod).toBe('export const PI = 3.14;');
	});
});

describe('Smoke: Multi-command sequence stress test', () => {
	it('handles rapid add/update/remove/undo/redo sequence', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);
		const getScene = (id: string) => project.scenes.find(s => s.id === id);
		const getObject = (id: string) => project.scenes.flatMap(s => s.objects).find(o => o.id === id);

		// Rapid-fire: add 10 objects
		for (let i = 0; i < 10; i++) {
			bus.execute(createAddObjectCommand(getScene, 's1', makeObj(`o${i}`, `Obj${i}`), 'mcp'));
		}
		expect(project.scenes[0].objects).toHaveLength(10);

		// Update all positions
		for (let i = 0; i < 10; i++) {
			bus.execute(createUpdateObjectCommand(getObject, `o${i}`, 'x', i * 100, 'mcp'));
		}
		expect(getObject('o5')!.x).toBe(500);

		// Undo all updates
		for (let i = 0; i < 10; i++) bus.undo();
		expect(getObject('o5')!.x).toBe(0);

		// Redo 5
		for (let i = 0; i < 5; i++) bus.redo();
		expect(getObject('o4')!.x).toBe(400);
		expect(getObject('o5')!.x).toBe(0); // not yet redone

		// Remove 3 objects
		for (let i = 7; i < 10; i++) {
			bus.execute(createRemoveObjectCommand(getScene, 's1', `o${i}`, 'mcp'));
		}
		expect(project.scenes[0].objects).toHaveLength(7);

		// Undo all 3 removes
		bus.undo(); bus.undo(); bus.undo();
		expect(project.scenes[0].objects).toHaveLength(10);
	});
});
