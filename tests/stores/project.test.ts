import { describe, it, expect } from 'vitest';
import type { Project, Scene, GameObject } from '$lib/types.js';
import { DEFAULT_CONFIG } from '$lib/constants.js';

// Since Svelte 5 runes ($state, $derived) only work in rune-aware contexts,
// we test a plain-object version of the store logic.
function projectStore() {
	let project: Project = {
		name: '',
		config: { ...DEFAULT_CONFIG },
		scenes: [],
		modules: [],
		assets: [],
	};

	function load(p: Project) {
		project.name = p.name;
		project.config = { ...p.config };
		project.scenes = p.scenes.map((s) => ({ ...s, objects: [...s.objects] }));
		project.modules = p.modules.map((m) => ({ ...m }));
		project.assets = (p.assets ?? []).map((a) => ({ ...a }));
	}

	function getScene(id: string): Scene | undefined {
		return project.scenes.find((s) => s.id === id);
	}

	function getModule(id: string) {
		return project.modules.find((m) => m.id === id);
	}

	function getObject(id: string): GameObject | undefined {
		for (const scene of project.scenes) {
			const obj = scene.objects.find((o) => o.id === id);
			if (obj) return obj;
		}
		return undefined;
	}

	function getObjectScene(objectId: string): Scene | undefined {
		return project.scenes.find((s) => s.objects.some((o) => o.id === objectId));
	}

	return {
		get project() {
			return project;
		},
		load,
		getScene,
		getModule,
		getObject,
		getObjectScene,
	};
}

const makeObj = (id: string, name: string): GameObject => ({
	id,
	name,
	objType: 'sprite',
	x: 0,
	y: 0,
	w: 32,
	h: 32,
	color: '#fff',
	visible: true,
	locked: false,
	props: {},
});

const makeScene = (id: string, name: string, objects: GameObject[] = []): Scene => ({
	id,
	name,
	description: '',
	objects,
	code: '',
});

describe('projectStore', () => {
	it('initializes with empty project', () => {
		const store = projectStore();
		expect(store.project.name).toBe('');
		expect(store.project.scenes).toEqual([]);
		expect(store.project.modules).toEqual([]);
		expect(store.project.config.width).toBe(DEFAULT_CONFIG.width);
	});

	it('loads a project', () => {
		const store = projectStore();
		const proj: Project = {
			name: 'My Game',
			config: { width: 1024, height: 768, physics: 'matter', pixelArt: true, backgroundColor: '#000' },
			scenes: [makeScene('s1', 'Scene 1')],
			modules: [{ id: 'm1', name: 'Utils', description: '', code: '' }],
			assets: [],
		};
		store.load(proj);
		expect(store.project.name).toBe('My Game');
		expect(store.project.config.width).toBe(1024);
		expect(store.project.scenes).toHaveLength(1);
		expect(store.project.modules).toHaveLength(1);
	});

	it('finds scene by id', () => {
		const store = projectStore();
		store.load({
			name: 'Test',
			config: { ...DEFAULT_CONFIG },
			scenes: [makeScene('s1', 'First'), makeScene('s2', 'Second')],
			modules: [],
			assets: [],
		});
		expect(store.getScene('s1')?.name).toBe('First');
		expect(store.getScene('s2')?.name).toBe('Second');
		expect(store.getScene('nope')).toBeUndefined();
	});

	it('finds object by id across scenes', () => {
		const store = projectStore();
		const obj1 = makeObj('o1', 'Player');
		const obj2 = makeObj('o2', 'Enemy');
		store.load({
			name: 'Test',
			config: { ...DEFAULT_CONFIG },
			scenes: [makeScene('s1', 'Scene1', [obj1]), makeScene('s2', 'Scene2', [obj2])],
			modules: [],
			assets: [],
		});
		expect(store.getObject('o1')?.name).toBe('Player');
		expect(store.getObject('o2')?.name).toBe('Enemy');
		expect(store.getObject('nope')).toBeUndefined();
	});

	it('finds which scene contains an object', () => {
		const store = projectStore();
		const obj1 = makeObj('o1', 'Player');
		store.load({
			name: 'Test',
			config: { ...DEFAULT_CONFIG },
			scenes: [makeScene('s1', 'Scene1', [obj1]), makeScene('s2', 'Scene2')],
			modules: [],
			assets: [],
		});
		expect(store.getObjectScene('o1')?.id).toBe('s1');
		expect(store.getObjectScene('nope')).toBeUndefined();
	});
});
