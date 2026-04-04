import type { Command, CommandSource, Scene } from '$lib/types.js';

export type ReorderDirection = 'up' | 'down' | 'front' | 'back';

export function createReorderObjectCommand(
	getScene: (id: string) => Scene | undefined,
	sceneId: string,
	objectId: string,
	direction: ReorderDirection,
	source: CommandSource,
): Command {
	let oldIndex = -1;
	let newIndex = -1;

	return {
		id: crypto.randomUUID(),
		type: 'reorder_object',
		description: `Move object ${objectId} ${direction}`,
		source,
		execute() {
			const scene = getScene(sceneId);
			if (!scene) throw new Error(`Scene ${sceneId} not found`);
			oldIndex = scene.objects.findIndex(o => o.id === objectId);
			if (oldIndex < 0) throw new Error(`Object ${objectId} not found`);

			const last = scene.objects.length - 1;
			switch (direction) {
				case 'up': newIndex = Math.min(oldIndex + 1, last); break;
				case 'down': newIndex = Math.max(oldIndex - 1, 0); break;
				case 'front': newIndex = last; break;
				case 'back': newIndex = 0; break;
			}

			if (newIndex !== oldIndex) {
				const [obj] = scene.objects.splice(oldIndex, 1);
				scene.objects.splice(newIndex, 0, obj);
			}
		},
		undo() {
			const scene = getScene(sceneId);
			if (!scene || newIndex === oldIndex) return;
			const [obj] = scene.objects.splice(newIndex, 1);
			scene.objects.splice(oldIndex, 0, obj);
		},
	};
}
