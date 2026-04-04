import { describe, it, expect } from 'vitest';
import { createReorderObjectCommand } from '$lib/commands/reorder-object.js';
import type { Scene, GameObject } from '$lib/types.js';

function makeObj(id: string, name: string): GameObject {
	return { id, name, objType: 'rectangle', x: 0, y: 0, w: 50, h: 50, color: '#fff', visible: true, locked: false, props: {} };
}

function makeScene(objects: GameObject[]): Scene {
	return { id: 's1', name: 'Main', description: '', objects, code: '' };
}

describe('createReorderObjectCommand', () => {
	it('moves object up one position', () => {
		const scene = makeScene([makeObj('a', 'A'), makeObj('b', 'B'), makeObj('c', 'C')]);
		const getScene = () => scene;
		const cmd = createReorderObjectCommand(getScene, 's1', 'a', 'up', 'user');
		cmd.execute();
		expect(scene.objects.map(o => o.id)).toEqual(['b', 'a', 'c']);
	});

	it('moves object down one position', () => {
		const scene = makeScene([makeObj('a', 'A'), makeObj('b', 'B'), makeObj('c', 'C')]);
		const getScene = () => scene;
		const cmd = createReorderObjectCommand(getScene, 's1', 'c', 'down', 'user');
		cmd.execute();
		expect(scene.objects.map(o => o.id)).toEqual(['a', 'c', 'b']);
	});

	it('moves object to front', () => {
		const scene = makeScene([makeObj('a', 'A'), makeObj('b', 'B'), makeObj('c', 'C')]);
		const getScene = () => scene;
		const cmd = createReorderObjectCommand(getScene, 's1', 'a', 'front', 'user');
		cmd.execute();
		expect(scene.objects.map(o => o.id)).toEqual(['b', 'c', 'a']);
	});

	it('moves object to back', () => {
		const scene = makeScene([makeObj('a', 'A'), makeObj('b', 'B'), makeObj('c', 'C')]);
		const getScene = () => scene;
		const cmd = createReorderObjectCommand(getScene, 's1', 'c', 'back', 'user');
		cmd.execute();
		expect(scene.objects.map(o => o.id)).toEqual(['c', 'a', 'b']);
	});

	it('undo restores original order', () => {
		const scene = makeScene([makeObj('a', 'A'), makeObj('b', 'B'), makeObj('c', 'C')]);
		const getScene = () => scene;
		const cmd = createReorderObjectCommand(getScene, 's1', 'a', 'front', 'user');
		cmd.execute();
		expect(scene.objects.map(o => o.id)).toEqual(['b', 'c', 'a']);
		cmd.undo();
		expect(scene.objects.map(o => o.id)).toEqual(['a', 'b', 'c']);
	});

	it('no-op when already at boundary', () => {
		const scene = makeScene([makeObj('a', 'A'), makeObj('b', 'B')]);
		const getScene = () => scene;
		const cmd = createReorderObjectCommand(getScene, 's1', 'b', 'up', 'user');
		cmd.execute();
		// b is already last (index 1), up would go to 1 — no change
		expect(scene.objects.map(o => o.id)).toEqual(['a', 'b']);
	});
});
