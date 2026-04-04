import type { Command, CommandSource, Project, Asset } from '$lib/types.js';

export function createRemoveAssetCommand(
	getProject: () => Project,
	assetId: string,
	source: CommandSource,
): Command {
	let snapshot: Asset | undefined;
	let index = -1;

	return {
		id: crypto.randomUUID(),
		type: 'remove_asset',
		description: `Remove asset ${assetId}`,
		source,
		execute() {
			const project = getProject();
			index = project.assets.findIndex(a => a.id === assetId);
			if (index < 0) throw new Error(`Asset ${assetId} not found`);
			snapshot = JSON.parse(JSON.stringify(project.assets[index]));
			project.assets.splice(index, 1);
		},
		undo() {
			const project = getProject();
			if (!snapshot) return;
			project.assets.splice(index, 0, snapshot);
		},
	};
}
