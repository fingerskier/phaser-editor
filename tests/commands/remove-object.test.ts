import { describe, it, expect } from 'vitest';
import { createRemoveObjectCommand } from '$lib/commands/remove-object.js';
import type { Scene, GameObject } from '$lib/types.js';

function makeObject(overrides: Partial<GameObject> = {}): GameObject {
	return {
		id: 'obj-1',
		name: 'Player',
		objType: 'sprite',
		x: 100, y: 200, w: 32, h: 32,
		color: '#ff0000',
		visible: true,
		locked: false,
		props: { speed: 5 },
		...overrides,
	};
}

function makeScene(objects: GameObject[] = []): Scene {
	return {
		id: 'scene-1',
		name: 'Main',
		description: '',
		objects,
		code: '',
	};
}

describe('createRemoveObjectCommand', () => {
	it('removes object from scene on execute', () => {
		const obj = makeObject();
		const scene = makeScene([obj]);
		const getScene = (id: string) => id === scene.id ? scene : undefined;

		const cmd = createRemoveObjectCommand(getScene, scene.id, obj.id, 'user');
		cmd.execute();

		expect(scene.objects).toHaveLength(0);
	});

	it('undo restores the object with full props', () => {
		const obj = makeObject({ props: { speed: 5, health: 100 } });
		const scene = makeScene([obj]);
		const getScene = (id: string) => id === scene.id ? scene : undefined;

		const cmd = createRemoveObjectCommand(getScene, scene.id, obj.id, 'user');
		cmd.execute();
		expect(scene.objects).toHaveLength(0);

		cmd.undo();
		expect(scene.objects).toHaveLength(1);
		expect(scene.objects[0].id).toBe('obj-1');
		expect(scene.objects[0].name).toBe('Player');
		expect(scene.objects[0].props).toEqual({ speed: 5, health: 100 });
	});

	it('throws if scene not found on execute', () => {
		const getScene = () => undefined;
		const cmd = createRemoveObjectCommand(getScene, 'missing', 'obj-1', 'user');
		expect(() => cmd.execute()).toThrow('Scene missing not found');
	});

	it('throws if object not found in scene on execute', () => {
		const scene = makeScene([]);
		const getScene = (id: string) => id === scene.id ? scene : undefined;
		const cmd = createRemoveObjectCommand(getScene, scene.id, 'nonexistent', 'user');
		expect(() => cmd.execute()).toThrow('Object nonexistent not found');
	});
});
