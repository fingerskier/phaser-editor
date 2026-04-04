import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Project, Scene, Module, Asset } from '$lib/types.js';

interface ProjectManifest {
	name: string;
	config: Project['config'];
	scenes: string[];
	modules: string[];
	assets?: Asset[];
}

export async function loadProject(dir: string): Promise<Project> {
	const raw = await readFile(join(dir, 'project.json'), 'utf-8');
	const manifest: ProjectManifest = JSON.parse(raw);

	const scenes: Scene[] = [];
	for (const sceneName of manifest.scenes) {
		const metaRaw = await readFile(join(dir, 'scenes', `${sceneName}.json`), 'utf-8');
		const meta = JSON.parse(metaRaw);
		let code = '';
		for (const ext of ['.ts', '.js']) {
			try {
				code = await readFile(join(dir, 'scenes', `${sceneName}${ext}`), 'utf-8');
				break;
			} catch {
				// try next extension
			}
		}
		scenes.push({
			id: meta.id,
			name: meta.name,
			description: meta.description || '',
			objects: meta.objects || [],
			code,
		});
	}

	const modules: Module[] = [];
	for (const modName of manifest.modules) {
		let code = '';
		for (const ext of ['.ts', '.js']) {
			try {
				code = await readFile(join(dir, 'modules', `${modName}${ext}`), 'utf-8');
				break;
			} catch {
				// try next extension
			}
		}
		modules.push({
			id: `mod-${modName.toLowerCase()}`,
			name: modName,
			description: '',
			code,
		});
	}

	return { name: manifest.name, config: manifest.config, scenes, modules, assets: manifest.assets ?? [] };
}
