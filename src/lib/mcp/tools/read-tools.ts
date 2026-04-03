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
					x: o.x,
					y: o.y,
					w: o.w,
					h: o.h,
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
					x: o.x,
					y: o.y,
					w: o.w,
					h: o.h,
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
