import type { Command, CommandSource, Scene, Project } from '$lib/types.js';

export function createAddSceneCommand(
	getProject: () => Project,
	scene: Scene,
	source: CommandSource,
): Command {
	return {
		id: crypto.randomUUID(),
		type: 'add_scene',
		description: `Add scene "${scene.name}"`,
		source,
		execute() { getProject().scenes.push({ ...scene, objects: [...scene.objects] }); },
		undo() {
			const p = getProject();
			const idx = p.scenes.findIndex(s => s.id === scene.id);
			if (idx >= 0) p.scenes.splice(idx, 1);
		},
	};
}
