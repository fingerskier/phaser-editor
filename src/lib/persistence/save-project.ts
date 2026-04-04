import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Project } from '$lib/types.js';

export async function saveProject(dir: string, project: Project): Promise<void> {
	await mkdir(join(dir, 'scenes'), { recursive: true });
	await mkdir(join(dir, 'modules'), { recursive: true });

	await mkdir(join(dir, 'assets'), { recursive: true });

	const manifest = {
		name: project.name,
		config: project.config,
		scenes: project.scenes.map((s) => s.name),
		modules: project.modules.map((m) => m.name),
		assets: project.assets ?? [],
	};
	await writeFile(join(dir, 'project.json'), JSON.stringify(manifest, null, 2));

	for (const scene of project.scenes) {
		const meta = {
			id: scene.id,
			name: scene.name,
			description: scene.description,
			objects: scene.objects,
		};
		await writeFile(join(dir, 'scenes', `${scene.name}.json`), JSON.stringify(meta, null, 2));
		await writeFile(join(dir, 'scenes', `${scene.name}.ts`), scene.code);
	}

	for (const mod of project.modules) {
		await writeFile(join(dir, 'modules', `${mod.name}.ts`), mod.code);
	}
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSave(dir: string, project: Project, delay = 500, onSaved?: () => void): void {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(async () => {
		await saveProject(dir, project);
		onSaved?.();
	}, delay);
}
