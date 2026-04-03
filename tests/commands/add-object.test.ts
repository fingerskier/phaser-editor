import { describe, it, expect } from 'vitest';
import { createAddObjectCommand } from '$lib/commands/add-object.js';
import type { Scene, GameObject } from '$lib/types.js';

function makeScene(overrides: Partial<Scene> = {}): Scene {
	return {
		id: 'scene-1',
		name: 'Main',
		description: '',
		objects: [],
		code: '',
		...overrides,
	};
}

function makeObject(overrides: Partial<GameObject> = {}): GameObject {
	return {
		id: 'obj-1',
		name: 'Player',
		objType: 'sprite',
		x: 100, y: 200, w: 32, h: 32,
		color: '#ff0000',
		visible: true,
		locked: false,
		props: {},
		...overrides,
	};
}

describe('createAddObjectCommand', () => {
	it('adds object to scene on execute', () => {
		const scene = makeScene();
		const getScene = (id: string) => id === scene.id ? scene : undefined;
		const obj = makeObject();

		const cmd = createAddObjectCommand(getScene, scene.id, obj, 'user');
		cmd.execute();

		expect(scene.objects).toHaveLength(1);
		expect(scene.objects[0].id).toBe('obj-1');
	});

	it('undo removes the added object', () => {
		const scene = makeScene();
		const getScene = (id: string) => id === scene.id ? scene : undefined;
		const obj = makeObject();

		const cmd = createAddObjectCommand(getScene, scene.id, obj, 'user');
		cmd.execute();
		expect(scene.objects).toHaveLength(1);

		cmd.undo();
		expect(scene.objects).toHaveLength(0);
	});

	it('throws if scene not found on execute', () => {
		const getScene = () => undefined;
		const obj = makeObject();

		const cmd = createAddObjectCommand(getScene, 'missing', obj, 'user');
		expect(() => cmd.execute()).toThrow('Scene missing not found');
	});
});
