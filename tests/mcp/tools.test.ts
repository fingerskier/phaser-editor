import { describe, it, expect, vi } from 'vitest';
import { createReadToolHandlers } from '$lib/mcp/tools/read-tools.js';
import { createWriteToolHandlers } from '$lib/mcp/tools/write-tools.js';
import type { Project, GameObject, Scene, Module } from '$lib/types.js';
import { createCommandBus } from '$lib/commands/command-bus.js';

function makeObject(overrides: Partial<GameObject> = {}): GameObject {
	return {
		id: 'obj-1',
		name: 'TestSprite',
		objType: 'sprite',
		x: 100, y: 200, w: 50, h: 50,
		color: '#ff0000',
		visible: true,
		locked: false,
		props: {},
		...overrides,
	};
}

function makeScene(overrides: Partial<Scene> = {}): Scene {
	return {
		id: 'scene-1',
		name: 'MainScene',
		description: 'The main scene',
		objects: [makeObject()],
		code: 'class MainScene extends Phaser.Scene {}',
		...overrides,
	};
}

function makeProject(overrides: Partial<Project> = {}): Project {
	return {
		name: 'TestProject',
		config: { width: 800, height: 600, physics: 'arcade', pixelArt: false, backgroundColor: '#1a1a2e' },
		scenes: [makeScene()],
		modules: [{ id: 'mod-1', name: 'Utils', description: 'Utility module', code: '// utils' }],
		assets: [],
		...overrides,
	};
}

describe('Read Tools', () => {
	it('get_project returns project summary with scene and module counts', () => {
		const project = makeProject();
		const handlers = createReadToolHandlers(
			() => project,
			() => [],
			(id: string) => project.scenes.flatMap(s => s.objects).find(o => o.id === id),
		);

		const result = handlers.get_project();
		expect(result.name).toBe('TestProject');
		expect(result.config.width).toBe(800);
		expect(result.scenes).toHaveLength(1);
		expect(result.scenes[0].objectCount).toBe(1);
		expect(result.modules).toHaveLength(1);
		expect(result.modules[0].name).toBe('Utils');
	});

	it('get_scene_tree returns scene objects with positions', () => {
		const project = makeProject();
		const handlers = createReadToolHandlers(
			() => project,
			() => [],
			(id: string) => project.scenes.flatMap(s => s.objects).find(o => o.id === id),
		);

		const result = handlers.get_scene_tree('scene-1');
		expect(result).not.toBeNull();
		expect(result!.name).toBe('MainScene');
		expect(result!.objects).toHaveLength(1);
		expect(result!.objects[0].type).toBe('sprite');
		expect(result!.objects[0].x).toBe(100);
	});

	it('get_scene_tree returns null for unknown scene', () => {
		const project = makeProject();
		const handlers = createReadToolHandlers(() => project, () => [], () => undefined);
		expect(handlers.get_scene_tree('nonexistent')).toBeNull();
	});

	it('get_selection returns selected objects', () => {
		const project = makeProject();
		const obj = project.scenes[0].objects[0];
		const handlers = createReadToolHandlers(
			() => project,
			() => [obj.id],
			(id: string) => project.scenes.flatMap(s => s.objects).find(o => o.id === id),
		);

		const result = handlers.get_selection();
		expect(result.objects).toHaveLength(1);
		expect(result.objects[0].name).toBe('TestSprite');
		expect(result.objects[0].props).toEqual({});
	});

	it('get_object returns object by id', () => {
		const project = makeProject();
		const handlers = createReadToolHandlers(
			() => project,
			() => [],
			(id: string) => project.scenes.flatMap(s => s.objects).find(o => o.id === id),
		);

		const result = handlers.get_object('obj-1');
		expect(result).not.toBeNull();
		expect(result!.name).toBe('TestSprite');
	});

	it('get_object returns null for unknown id', () => {
		const project = makeProject();
		const handlers = createReadToolHandlers(() => project, () => [], () => undefined);
		expect(handlers.get_object('nope')).toBeNull();
	});
});

describe('Write Tools', () => {
	function makeHistory() {
		const stack: any[] = [];
		const redoStack: any[] = [];
		return {
			execute(cmd: any) { cmd.execute(); stack.push(cmd); },
			undo() { const cmd = stack.pop(); if (cmd) { cmd.undo(); redoStack.push(cmd); return cmd; } },
			redo() { const cmd = redoStack.pop(); if (cmd) { cmd.execute(); stack.push(cmd); return cmd; } },
		};
	}

	it('update_object modifies object properties via command bus', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);
		const allObjects = () => project.scenes.flatMap(s => s.objects);

		const handlers = createWriteToolHandlers(bus, {
			getProject: () => project,
			getScene: (id) => project.scenes.find(s => s.id === id),
			getObject: (id) => allObjects().find(o => o.id === id),
			getObjectScene: (oid) => project.scenes.find(s => s.objects.some(o => o.id === oid)),
			getTarget: (id) => project.scenes.find(s => s.id === id) ?? project.modules.find(m => m.id === id),
		});

		handlers.update_object('obj-1', { x: 500, y: 300 });
		const obj = allObjects().find(o => o.id === 'obj-1')!;
		expect(obj.x).toBe(500);
		expect(obj.y).toBe(300);
	});

	it('add_object adds a new object to a scene', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);

		const handlers = createWriteToolHandlers(bus, {
			getProject: () => project,
			getScene: (id) => project.scenes.find(s => s.id === id),
			getObject: () => undefined,
			getObjectScene: () => undefined,
			getTarget: (id) => project.scenes.find(s => s.id === id),
		});

		const newObj = makeObject({ id: 'obj-2', name: 'NewSprite' });
		handlers.add_object('scene-1', newObj);
		expect(project.scenes[0].objects).toHaveLength(2);
		expect(project.scenes[0].objects[1].name).toBe('NewSprite');
	});

	it('remove_object removes an object from its scene', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);
		const allObjects = () => project.scenes.flatMap(s => s.objects);

		const handlers = createWriteToolHandlers(bus, {
			getProject: () => project,
			getScene: (id) => project.scenes.find(s => s.id === id),
			getObject: (id) => allObjects().find(o => o.id === id),
			getObjectScene: (oid) => project.scenes.find(s => s.objects.some(o => o.id === oid)),
			getTarget: (id) => project.scenes.find(s => s.id === id),
		});

		handlers.remove_object('obj-1');
		expect(project.scenes[0].objects).toHaveLength(0);
	});

	it('add_scene creates a new scene on the project', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);

		const handlers = createWriteToolHandlers(bus, {
			getProject: () => project,
			getScene: (id) => project.scenes.find(s => s.id === id),
			getObject: () => undefined,
			getObjectScene: () => undefined,
			getTarget: (id) => project.scenes.find(s => s.id === id),
		});

		const scene = handlers.add_scene('Level2', 'Second level');
		expect(project.scenes).toHaveLength(2);
		expect(scene.name).toBe('Level2');
		expect(scene.code).toContain('Level2');
	});

	it('undo reverses the last command', () => {
		const project = makeProject();
		const history = makeHistory();
		const bus = createCommandBus(history);
		const allObjects = () => project.scenes.flatMap(s => s.objects);

		const handlers = createWriteToolHandlers(bus, {
			getProject: () => project,
			getScene: (id) => project.scenes.find(s => s.id === id),
			getObject: (id) => allObjects().find(o => o.id === id),
			getObjectScene: (oid) => project.scenes.find(s => s.objects.some(o => o.id === oid)),
			getTarget: (id) => project.scenes.find(s => s.id === id),
		});

		handlers.update_object('obj-1', { x: 999 });
		expect(allObjects().find(o => o.id === 'obj-1')!.x).toBe(999);
		handlers.undo();
		expect(allObjects().find(o => o.id === 'obj-1')!.x).toBe(100);
	});
});
