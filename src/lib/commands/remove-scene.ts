import type { Command, CommandSource, Scene, Project } from '$lib/types.js';

export function createRemoveSceneCommand(
	getProject: () => Project,
	sceneId: string,
	source: CommandSource,
): Command {
	let snapshot: Scene | undefined;
	let index = -1;

	return {
		id: crypto.randomUUID(),
		type: 'remove_scene',
		description: `Remove scene ${sceneId}`,
		source,
		execute() {
			const p = getProject();
			index = p.scenes.findIndex(s => s.id === sceneId);
			if (index < 0) throw new Error(`Scene ${sceneId} not found`);
			snapshot = JSON.parse(JSON.stringify(p.scenes[index]));
			p.scenes.splice(index, 1);
		},
		undo() {
			const p = getProject();
			if (snapshot) p.scenes.splice(index, 0, snapshot);
		},
	};
}
