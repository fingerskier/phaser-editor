import { describe, it, expect } from 'vitest';
import { createAddAssetCommand } from '$lib/commands/add-asset.js';
import type { Project, Asset } from '$lib/types.js';

function makeProject(overrides: Partial<Project> = {}): Project {
	return {
		name: 'test',
		config: { width: 800, height: 600, physics: 'arcade', pixelArt: false, backgroundColor: '#000' },
		scenes: [],
		modules: [],
		assets: [],
		...overrides,
	};
}

function makeAsset(overrides: Partial<Asset> = {}): Asset {
	return {
		id: 'asset-1',
		key: 'player',
		filename: 'player.png',
		type: 'image',
		...overrides,
	};
}

describe('createAddAssetCommand', () => {
	it('adds asset to project on execute', () => {
		const project = makeProject();
		const asset = makeAsset();
		const cmd = createAddAssetCommand(() => project, asset, 'user');
		cmd.execute();

		expect(project.assets).toHaveLength(1);
		expect(project.assets[0].key).toBe('player');
	});

	it('undo removes the added asset', () => {
		const project = makeProject();
		const asset = makeAsset();
		const cmd = createAddAssetCommand(() => project, asset, 'user');
		cmd.execute();
		expect(project.assets).toHaveLength(1);

		cmd.undo();
		expect(project.assets).toHaveLength(0);
	});
});
