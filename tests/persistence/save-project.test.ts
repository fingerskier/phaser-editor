// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { saveProject } from '$lib/persistence/save-project.js';
import { loadProject } from '$lib/persistence/load-project.js';
import type { Project } from '$lib/types.js';

function makeTestProject(): Project {
	return {
		name: 'RoundTripGame',
		config: {
			width: 1024,
			height: 768,
			physics: 'arcade',
			pixelArt: true,
			backgroundColor: '#1a1a2e',
		},
		scenes: [
			{
				id: 'scene-level1',
				name: 'Level1',
				description: 'First level',
				objects: [
					{
						id: 'obj-hero',
						name: 'Hero',
						objType: 'sprite',
						x: 50,
						y: 300,
						w: 64,
						h: 64,
						color: '#00ff00',
						visible: true,
						locked: false,
						props: { speed: 200 },
					},
				],
				code: 'export class Level1 extends Phaser.Scene {}',
			},
		],
		modules: [
			{
				id: 'mod-helper',
				name: 'Helper',
				description: '',
				code: 'export function clamp(v: number) { return v; }',
			},
		],
		assets: [],
	};
}

describe('saveProject', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'phaser-save-test-'));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	it('writes project files to disk', async () => {
		const project = makeTestProject();
		await saveProject(dir, project);

		// Verify project.json exists and has correct content
		const manifestRaw = await readFile(join(dir, 'project.json'), 'utf-8');
		const manifest = JSON.parse(manifestRaw);
		expect(manifest.name).toBe('RoundTripGame');
		expect(manifest.config.width).toBe(1024);
		expect(manifest.scenes).toEqual(['Level1']);
		expect(manifest.modules).toEqual(['Helper']);

		// Verify scene files
		const sceneMeta = JSON.parse(await readFile(join(dir, 'scenes', 'Level1.json'), 'utf-8'));
		expect(sceneMeta.id).toBe('scene-level1');
		expect(sceneMeta.name).toBe('Level1');
		expect(sceneMeta.objects).toHaveLength(1);
		expect(sceneMeta.objects[0].name).toBe('Hero');

		const sceneCode = await readFile(join(dir, 'scenes', 'Level1.ts'), 'utf-8');
		expect(sceneCode).toBe('export class Level1 extends Phaser.Scene {}');

		// Verify module files
		const modCode = await readFile(join(dir, 'modules', 'Helper.ts'), 'utf-8');
		expect(modCode).toBe('export function clamp(v: number) { return v; }');
	});

	it('round-trips through save and load', async () => {
		const original = makeTestProject();
		await saveProject(dir, original);
		const loaded = await loadProject(dir);

		expect(loaded.name).toBe(original.name);
		expect(loaded.config).toEqual(original.config);
		expect(loaded.scenes).toHaveLength(1);
		expect(loaded.scenes[0].id).toBe(original.scenes[0].id);
		expect(loaded.scenes[0].name).toBe(original.scenes[0].name);
		expect(loaded.scenes[0].description).toBe(original.scenes[0].description);
		expect(loaded.scenes[0].objects).toEqual(original.scenes[0].objects);
		expect(loaded.scenes[0].code).toBe(original.scenes[0].code);
		expect(loaded.modules).toHaveLength(1);
		expect(loaded.modules[0].name).toBe(original.modules[0].name);
		expect(loaded.modules[0].code).toBe(original.modules[0].code);
	});

	it('creates subdirectories if they do not exist', async () => {
		const freshDir = join(dir, 'nested', 'project');
		const project = makeTestProject();
		await saveProject(freshDir, project);

		// Should not throw -- directories created automatically
		await access(join(freshDir, 'project.json'));
		await access(join(freshDir, 'scenes', 'Level1.json'));
		await access(join(freshDir, 'modules', 'Helper.ts'));
	});
});
