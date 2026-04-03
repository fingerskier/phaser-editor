import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { loadProject } from '$lib/persistence/load-project.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	const projectDir = env.PHASER_PROJECT_DIR || './sample-project';
	try {
		const project = await loadProject(projectDir);
		return json(project);
	} catch (e) {
		return json({
			name: 'new-project',
			config: { width: 800, height: 600, physics: 'arcade', pixelArt: false, backgroundColor: '#1a1a2e' },
			scenes: [],
			modules: [],
		});
	}
};
