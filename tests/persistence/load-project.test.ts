// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadProject } from '$lib/persistence/load-project.js';

describe('loadProject', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'phaser-test-'));
		await mkdir(join(dir, 'scenes'), { recursive: true });
		await mkdir(join(dir, 'modules'), { recursive: true });
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	it('loads a project with scenes and modules', async () => {
		const manifest = {
			name: 'TestGame',
			config: {
				width: 800,
				height: 600,
				physics: 'arcade',
				pixelArt: false,
				backgroundColor: '#000000',
			},
			scenes: ['Main'],
			modules: ['Utils'],
		};
		await writeFile(join(dir, 'project.json'), JSON.stringify(manifest));

		const sceneMeta = {
			id: 'scene-1',
			name: 'Main',
			description: 'The main scene',
			objects: [
				{
					id: 'obj-1',
					name: 'Player',
					objType: 'sprite',
					x: 100,
					y: 200,
					w: 32,
					h: 32,
					color: '#ff0000',
					visible: true,
					locked: false,
					props: {},
				},
			],
		};
		await writeFile(join(dir, 'scenes', 'Main.json'), JSON.stringify(sceneMeta));
		await writeFile(join(dir, 'scenes', 'Main.ts'), 'export class Main {}');
		await writeFile(join(dir, 'modules', 'Utils.ts'), 'export function helper() {}');

		const project = await loadProject(dir);

		expect(project.name).toBe('TestGame');
		expect(project.config.width).toBe(800);
		expect(project.config.height).toBe(600);
		expect(project.config.physics).toBe('arcade');
		expect(project.scenes).toHaveLength(1);
		expect(project.scenes[0].id).toBe('scene-1');
		expect(project.scenes[0].name).toBe('Main');
		expect(project.scenes[0].description).toBe('The main scene');
		expect(project.scenes[0].objects).toHaveLength(1);
		expect(project.scenes[0].objects[0].name).toBe('Player');
		expect(project.scenes[0].code).toBe('export class Main {}');
		expect(project.modules).toHaveLength(1);
		expect(project.modules[0].name).toBe('Utils');
		expect(project.modules[0].code).toBe('export function helper() {}');
	});

	it('loads .js files when .ts files are missing', async () => {
		const manifest = {
			name: 'JsGame',
			config: { width: 640, height: 480, physics: 'matter', pixelArt: true, backgroundColor: '#111111' },
			scenes: ['Intro'],
			modules: ['Helpers'],
		};
		await writeFile(join(dir, 'project.json'), JSON.stringify(manifest));
		await writeFile(join(dir, 'scenes', 'Intro.json'), JSON.stringify({ id: 's-intro', name: 'Intro', description: '' }));
		await writeFile(join(dir, 'scenes', 'Intro.js'), 'class Intro {}');
		await writeFile(join(dir, 'modules', 'Helpers.js'), 'function help() {}');

		const project = await loadProject(dir);

		expect(project.scenes[0].code).toBe('class Intro {}');
		expect(project.modules[0].code).toBe('function help() {}');
	});

	it('handles scenes with no code file gracefully', async () => {
		const manifest = {
			name: 'EmptyGame',
			config: { width: 320, height: 240, physics: 'arcade', pixelArt: false, backgroundColor: '#ffffff' },
			scenes: ['Empty'],
			modules: [],
		};
		await writeFile(join(dir, 'project.json'), JSON.stringify(manifest));
		await writeFile(join(dir, 'scenes', 'Empty.json'), JSON.stringify({ id: 's-empty', name: 'Empty' }));

		const project = await loadProject(dir);

		expect(project.scenes[0].code).toBe('');
		expect(project.modules).toHaveLength(0);
	});
});
