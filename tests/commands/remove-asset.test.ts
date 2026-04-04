import { describe, it, expect } from 'vitest';
import { createRemoveAssetCommand } from '$lib/commands/remove-asset.js';
import type { Project, Asset } from '$lib/types.js';

function makeProject(assets: Asset[] = []): Project {
	return {
		name: 'test',
		config: { width: 800, height: 600, physics: 'arcade', pixelArt: false, backgroundColor: '#000' },
		scenes: [],
		modules: [],
		assets,
	};
}

describe('createRemoveAssetCommand', () => {
	it('removes asset on execute', () => {
		const asset: Asset = { id: 'a1', key: 'coin', filename: 'coin.png', type: 'image' };
		const project = makeProject([asset]);
		const cmd = createRemoveAssetCommand(() => project, 'a1', 'user');
		cmd.execute();

		expect(project.assets).toHaveLength(0);
	});

	it('undo restores the removed asset', () => {
		const asset: Asset = { id: 'a1', key: 'coin', filename: 'coin.png', type: 'image' };
		const project = makeProject([asset]);
		const cmd = createRemoveAssetCommand(() => project, 'a1', 'user');
		cmd.execute();
		expect(project.assets).toHaveLength(0);

		cmd.undo();
		expect(project.assets).toHaveLength(1);
		expect(project.assets[0].key).toBe('coin');
	});

	it('throws if asset not found', () => {
		const project = makeProject([]);
		const cmd = createRemoveAssetCommand(() => project, 'missing', 'user');
		expect(() => cmd.execute()).toThrow('Asset missing not found');
	});
});
