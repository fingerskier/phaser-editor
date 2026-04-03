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
