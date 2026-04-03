import { describe, it, expect } from 'vitest';
import { createUpdateObjectCommand } from '$lib/commands/update-object.js';
import type { GameObject } from '$lib/types.js';

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

describe('createUpdateObjectCommand', () => {
	it('updates a core prop (x)', () => {
		const obj = makeObject();
		const getObject = (id: string) => id === obj.id ? obj : undefined;

		const cmd = createUpdateObjectCommand(getObject, obj.id, 'x', 999, 'user');
		cmd.execute();

		expect(obj.x).toBe(999);
	});

	it('undo restores the original core prop value', () => {
		const obj = makeObject({ x: 100 });
		const getObject = (id: string) => id === obj.id ? obj : undefined;

		const cmd = createUpdateObjectCommand(getObject, obj.id, 'x', 999, 'user');
		cmd.execute();
		expect(obj.x).toBe(999);

		cmd.undo();
		expect(obj.x).toBe(100);
	});

	it('updates a custom prop stored in obj.props', () => {
		const obj = makeObject({ props: { speed: 5 } });
		const getObject = (id: string) => id === obj.id ? obj : undefined;

		const cmd = createUpdateObjectCommand(getObject, obj.id, 'speed', 10, 'user');
		cmd.execute();

		expect(obj.props.speed).toBe(10);
	});

	it('undo removes a custom prop that did not exist before', () => {
		const obj = makeObject({ props: {} });
		const getObject = (id: string) => id === obj.id ? obj : undefined;

		const cmd = createUpdateObjectCommand(getObject, obj.id, 'newProp', 'hello', 'user');
		cmd.execute();
		expect(obj.props.newProp).toBe('hello');

		cmd.undo();
		expect(obj.props.newProp).toBeUndefined();
		expect('newProp' in obj.props).toBe(false);
	});

	it('throws if object not found', () => {
		const getObject = () => undefined;
		expect(() => createUpdateObjectCommand(getObject, 'missing', 'x', 1, 'user'))
			.toThrow('Object missing not found');
	});
});
