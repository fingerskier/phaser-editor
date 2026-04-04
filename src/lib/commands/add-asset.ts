import type { Command, CommandSource, Project, Asset } from '$lib/types.js';

export function createAddAssetCommand(
	getProject: () => Project,
	asset: Asset,
	source: CommandSource,
): Command {
	return {
		id: crypto.randomUUID(),
		type: 'add_asset',
		description: `Add asset "${asset.key}"`,
		source,
		execute() {
			const project = getProject();
			project.assets.push({ ...asset });
		},
		undo() {
			const project = getProject();
			const idx = project.assets.findIndex(a => a.id === asset.id);
			if (idx >= 0) project.assets.splice(idx, 1);
		},
	};
}
