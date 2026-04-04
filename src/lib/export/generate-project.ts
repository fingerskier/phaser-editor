import type { Project, Scene, GameObject, Asset } from '$lib/types.js';

export interface ExportFile {
	path: string;
	content: string;
}

export function generateExportFiles(project: Project): ExportFile[] {
	const files: ExportFile[] = [];

	files.push({ path: 'package.json', content: generatePackageJson(project) });
	files.push({ path: 'tsconfig.json', content: generateTsConfig() });
	files.push({ path: 'vite.config.ts', content: generateViteConfig() });
	files.push({ path: 'index.html', content: generateIndexHtml(project) });
	files.push({ path: 'src/main.ts', content: generateMain(project) });

	for (const scene of project.scenes) {
		files.push({
			path: `src/scenes/${scene.name}.ts`,
			content: generateSceneFile(scene, project.assets),
		});
	}

	for (const mod of project.modules) {
		files.push({
			path: `src/modules/${mod.name}.ts`,
			content: mod.code,
		});
	}

	return files;
}

function generatePackageJson(project: Project): string {
	const pkg = {
		name: project.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
		version: '1.0.0',
		private: true,
		type: 'module',
		scripts: {
			dev: 'vite',
			build: 'vite build',
			preview: 'vite preview',
		},
		dependencies: {
			phaser: '^3.90.0',
		},
		devDependencies: {
			typescript: '~5.7.0',
			vite: '^6.0.0',
		},
	};
	return JSON.stringify(pkg, null, 2);
}

function generateTsConfig(): string {
	const config = {
		compilerOptions: {
			target: 'ES2020',
			module: 'ESNext',
			moduleResolution: 'bundler',
			strict: true,
			esModuleInterop: true,
			skipLibCheck: true,
			outDir: 'dist',
		},
		include: ['src'],
	};
	return JSON.stringify(config, null, 2);
}

function generateViteConfig(): string {
	return `import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
`;
}

function generateIndexHtml(project: Project): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(project.name)}</title>
  <style>
    * { margin: 0; padding: 0; }
    body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`;
}

function generateMain(project: Project): string {
	const sceneImports = project.scenes
		.map((s) => `import { ${s.name} } from './scenes/${s.name}.js';`)
		.join('\n');

	const sceneList = project.scenes.map((s) => s.name).join(', ');

	return `import Phaser from 'phaser';
${sceneImports}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: ${project.config.width},
  height: ${project.config.height},
  backgroundColor: '${project.config.backgroundColor}',
  pixelArt: ${project.config.pixelArt},
  physics: {
    default: '${project.config.physics}',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
    },
  },
  scene: [${sceneList}],
};

new Phaser.Game(config);
`;
}

function generateSceneFile(scene: Scene, assets: Asset[]): string {
	const preloadLines = generatePreload(scene.objects, assets);
	const createLines = generateCreate(scene.objects, assets);

	// If the user has custom code that already extends Phaser.Scene, use it as-is
	// but inject a comment about the generated create objects
	if (scene.code.includes('extends Phaser.Scene') && scene.code.includes('create')) {
		// Merge: inject object creation into existing code
		return generateMergedScene(scene, preloadLines, createLines);
	}

	return `import Phaser from 'phaser';

export class ${scene.name} extends Phaser.Scene {
  constructor() {
    super({ key: '${scene.name}' });
  }

${preloadLines ? `  preload() {\n${preloadLines}\n  }\n\n` : ''}  create() {
${createLines}
  }

  update() {}
}
`;
}

function generateMergedScene(scene: Scene, preloadLines: string, createLines: string): string {
	let code = scene.code;

	// Ensure export keyword
	if (!code.includes('export class') && !code.includes('export default')) {
		code = code.replace(/^class /, 'export class ');
	}

	// Add import if missing
	if (!code.includes("import Phaser") && !code.includes("from 'phaser'")) {
		code = `import Phaser from 'phaser';\n\n${code}`;
	}

	// Inject generated objects as a comment block before the class
	const objectComment = createLines
		? `\n/* --- Editor objects (paste into create()) ---\n${createLines}\n--- */\n`
		: '';

	return code + objectComment;
}

function generatePreload(objects: GameObject[], assets: Asset[]): string {
	const usedKeys = new Set<string>();
	for (const obj of objects) {
		const key = obj.props.assetKey as string | undefined;
		if (key) usedKeys.add(key);
	}

	if (usedKeys.size === 0) return '';

	const lines: string[] = [];
	for (const key of usedKeys) {
		const asset = assets.find((a) => a.key === key);
		if (!asset) continue;
		if (asset.type === 'spritesheet' && asset.frameWidth && asset.frameHeight) {
			lines.push(`    this.load.spritesheet('${key}', 'assets/${asset.filename}', { frameWidth: ${asset.frameWidth}, frameHeight: ${asset.frameHeight} });`);
		} else if (asset.type === 'audio') {
			lines.push(`    this.load.audio('${key}', 'assets/${asset.filename}');`);
		} else {
			lines.push(`    this.load.image('${key}', 'assets/${asset.filename}');`);
		}
	}

	return lines.join('\n');
}

function generateCreate(objects: GameObject[], assets: Asset[]): string {
	const lines: string[] = [];

	for (const obj of objects) {
		if (!obj.visible) continue;
		const assetKey = obj.props.assetKey as string | undefined;
		const colorNum = `0x${obj.color.replace('#', '')}`;

		switch (obj.objType) {
			case 'sprite':
			case 'image':
				if (assetKey) {
					lines.push(`    this.add.image(${obj.x}, ${obj.y}, '${assetKey}').setDisplaySize(${obj.w}, ${obj.h}); // ${obj.name}`);
				} else {
					lines.push(`    this.add.rectangle(${obj.x}, ${obj.y}, ${obj.w}, ${obj.h}, ${colorNum}); // ${obj.name} (no asset)`);
				}
				break;
			case 'rectangle':
				lines.push(`    this.add.rectangle(${obj.x}, ${obj.y}, ${obj.w}, ${obj.h}, ${colorNum}); // ${obj.name}`);
				break;
			case 'circle':
				lines.push(`    this.add.circle(${obj.x}, ${obj.y}, ${obj.w / 2}, ${colorNum}); // ${obj.name}`);
				break;
			case 'text': {
				const text = String(obj.props.text ?? obj.name);
				const fontSize = String(obj.props.fontSize ?? '16px');
				lines.push(`    this.add.text(${obj.x}, ${obj.y}, '${escapeJs(text)}', { fontSize: '${fontSize}', color: '${obj.color}' }); // ${obj.name}`);
				break;
			}
			case 'zone':
				lines.push(`    this.add.zone(${obj.x}, ${obj.y}, ${obj.w}, ${obj.h}); // ${obj.name}`);
				break;
			default:
				lines.push(`    this.add.rectangle(${obj.x}, ${obj.y}, ${obj.w}, ${obj.h}, ${colorNum}); // ${obj.name}`);
				break;
		}
	}

	return lines.join('\n');
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJs(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}
