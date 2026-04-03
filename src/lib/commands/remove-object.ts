import type { Command, CommandSource, Scene, GameObject } from '$lib/types.js';

export function createRemoveObjectCommand(
	getScene: (id: string) => Scene | undefined,
	sceneId: string,
	objectId: string,
	source: CommandSource,
): Command {
	let snapshot: GameObject | undefined;
	let index = -1;

	return {
		id: crypto.randomUUID(),
		type: 'remove_object',
		description: `Remove object ${objectId}`,
		source,
		execute() {
			const scene = getScene(sceneId);
			if (!scene) throw new Error(`Scene ${sceneId} not found`);
			index = scene.objects.findIndex(o => o.id === objectId);
			if (index < 0) throw new Error(`Object ${objectId} not found`);
			snapshot = JSON.parse(JSON.stringify(scene.objects[index]));
			scene.objects.splice(index, 1);
		},
		undo() {
			const scene = getScene(sceneId);
			if (!scene || !snapshot) return;
			scene.objects.splice(index, 0, snapshot);
		},
	};
}
