import type { Project, Scene, Module, GameObject, Asset } from '$lib/types.js';
import { DEFAULT_CONFIG } from '$lib/constants.js';

export function projectStore() {
	let project = $state<Project>({
		name: '',
		config: { ...DEFAULT_CONFIG },
		scenes: [],
		modules: [],
		assets: [],
	});

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

	function getModule(id: string): Module | undefined {
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

	function getAsset(id: string): Asset | undefined {
		return project.assets.find((a) => a.id === id);
	}

	function getAssetByKey(key: string): Asset | undefined {
		return project.assets.find((a) => a.key === key);
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
		getAsset,
		getAssetByKey,
	};
}
