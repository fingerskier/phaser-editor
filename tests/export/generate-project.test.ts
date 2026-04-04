import { describe, it, expect } from 'vitest';
import { generateExportFiles } from '$lib/export/generate-project.js';
import type { Project, Asset } from '$lib/types.js';

function makeProject(overrides: Partial<Project> = {}): Project {
	return {
		name: 'TestGame',
		config: { width: 800, height: 600, physics: 'arcade', pixelArt: false, backgroundColor: '#1a1a2e' },
		scenes: [
			{
				id: 's1',
				name: 'MainScene',
				description: 'Main scene',
				objects: [
					{ id: 'o1', name: 'platform', objType: 'rectangle', x: 400, y: 500, w: 600, h: 32, color: '#78716c', visible: true, locked: false, props: {} },
					{ id: 'o2', name: 'player', objType: 'sprite', x: 100, y: 400, w: 32, h: 48, color: '#4ade80', visible: true, locked: false, props: { assetKey: 'hero' } },
					{ id: 'o3', name: 'title', objType: 'text', x: 300, y: 50, w: 200, h: 40, color: '#ffffff', visible: true, locked: false, props: { text: 'Hello World', fontSize: '24px' } },
				],
				code: 'class MainScene extends Phaser.Scene {\n\tconstructor() { super({ key: \'MainScene\' }); }\n\tcreate() {}\n\tupdate() {}\n}',
			},
		],
		modules: [],
		assets: [
			{ id: 'a1', key: 'hero', filename: 'hero.png', type: 'image' },
		],
		...overrides,
	};
}

describe('generateExportFiles', () => {
	it('generates all required files', () => {
		const files = generateExportFiles(makeProject());
		const paths = files.map(f => f.path);

		expect(paths).toContain('package.json');
		expect(paths).toContain('tsconfig.json');
		expect(paths).toContain('vite.config.ts');
		expect(paths).toContain('index.html');
		expect(paths).toContain('src/main.ts');
		expect(paths).toContain('src/scenes/MainScene.ts');
	});

	it('generates valid package.json with phaser dependency', () => {
		const files = generateExportFiles(makeProject());
		const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);

		expect(pkg.name).toBe('testgame');
		expect(pkg.dependencies.phaser).toBeDefined();
		expect(pkg.scripts.dev).toBe('vite');
		expect(pkg.scripts.build).toBe('vite build');
	});

	it('generates main.ts with scene imports and config', () => {
		const files = generateExportFiles(makeProject());
		const main = files.find(f => f.path === 'src/main.ts')!.content;

		expect(main).toContain("import { MainScene }");
		expect(main).toContain('width: 800');
		expect(main).toContain('height: 600');
		expect(main).toContain("scene: [MainScene]");
		expect(main).toContain("new Phaser.Game(config)");
	});

	it('generates scene file with object creation code', () => {
		const files = generateExportFiles(makeProject());
		const scene = files.find(f => f.path === 'src/scenes/MainScene.ts')!.content;

		// Rectangle
		expect(scene).toContain('this.add.rectangle(400, 500, 600, 32');
		// Sprite with asset
		expect(scene).toContain("this.add.image(100, 400, 'hero')");
		// Text
		expect(scene).toContain("this.add.text(300, 50, 'Hello World'");
	});

	it('generates preload for used assets', () => {
		const project = makeProject({
			scenes: [{
				id: 's1', name: 'MainScene', description: '', code: '',
				objects: [
					{ id: 'o1', name: 'player', objType: 'sprite', x: 100, y: 400, w: 32, h: 48, color: '#4ade80', visible: true, locked: false, props: { assetKey: 'hero' } },
				],
			}],
		});
		const files = generateExportFiles(project);
		const scene = files.find(f => f.path === 'src/scenes/MainScene.ts')!.content;

		expect(scene).toContain("this.load.image('hero', 'assets/hero.png')");
	});

	it('generates preload for spritesheets with frame dimensions', () => {
		const project = makeProject({
			scenes: [{
				id: 's1', name: 'MainScene', description: '', code: '',
				objects: [
					{ id: 'o1', name: 'player', objType: 'sprite', x: 100, y: 400, w: 32, h: 48, color: '#4ade80', visible: true, locked: false, props: { assetKey: 'hero' } },
				],
			}],
			assets: [
				{ id: 'a1', key: 'hero', filename: 'hero.png', type: 'spritesheet', frameWidth: 32, frameHeight: 32 },
			],
		});
		const files = generateExportFiles(project);
		const scene = files.find(f => f.path === 'src/scenes/MainScene.ts')!.content;

		expect(scene).toContain("this.load.spritesheet('hero', 'assets/hero.png', { frameWidth: 32, frameHeight: 32 })");
	});

	it('handles project with no objects', () => {
		const project = makeProject({
			scenes: [{ id: 's1', name: 'Empty', description: '', objects: [], code: '' }],
			assets: [],
		});
		const files = generateExportFiles(project);
		const scene = files.find(f => f.path === 'src/scenes/Empty.ts')!.content;

		expect(scene).toContain('export class Empty extends Phaser.Scene');
		expect(scene).toContain('create()');
	});

	it('handles multiple scenes', () => {
		const project = makeProject({
			scenes: [
				{ id: 's1', name: 'Menu', description: '', objects: [], code: '' },
				{ id: 's2', name: 'Game', description: '', objects: [], code: '' },
			],
		});
		const files = generateExportFiles(project);
		const paths = files.map(f => f.path);

		expect(paths).toContain('src/scenes/Menu.ts');
		expect(paths).toContain('src/scenes/Game.ts');

		const main = files.find(f => f.path === 'src/main.ts')!.content;
		expect(main).toContain("import { Menu }");
		expect(main).toContain("import { Game }");
		expect(main).toContain("scene: [Menu, Game]");
	});

	it('skips invisible objects', () => {
		const project = makeProject({
			scenes: [{
				id: 's1', name: 'Test', description: '', code: '',
				objects: [
					{ id: 'o1', name: 'visible', objType: 'rectangle', x: 0, y: 0, w: 10, h: 10, color: '#fff', visible: true, locked: false, props: {} },
					{ id: 'o2', name: 'hidden', objType: 'rectangle', x: 0, y: 0, w: 10, h: 10, color: '#fff', visible: false, locked: false, props: {} },
				],
			}],
		});
		const files = generateExportFiles(project);
		const scene = files.find(f => f.path === 'src/scenes/Test.ts')!.content;

		expect(scene).toContain('// visible');
		expect(scene).not.toContain('// hidden');
	});

	it('index.html includes project name', () => {
		const files = generateExportFiles(makeProject());
		const html = files.find(f => f.path === 'index.html')!.content;

		expect(html).toContain('<title>TestGame</title>');
		expect(html).toContain('src/main.ts');
	});
});
