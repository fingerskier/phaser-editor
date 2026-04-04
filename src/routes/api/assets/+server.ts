import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { env } from '$env/dynamic/private';
import { serverProject } from '$lib/server/state.js';

const projectDir = () => env.PHASER_PROJECT_DIR || './sample-project';

export const GET: RequestHandler = async () => {
	return json(serverProject.project.assets ?? []);
};

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const key = formData.get('key') as string | null;
	const type = (formData.get('type') as string) || 'image';

	if (!file || !key) {
		return json({ error: 'file and key are required' }, { status: 400 });
	}

	const ext = extname(file.name) || '.png';
	const sanitized = key.replace(/[^a-zA-Z0-9_-]/g, '_');
	const filename = `${sanitized}${ext}`;

	const assetsDir = join(projectDir(), 'assets');
	await mkdir(assetsDir, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(join(assetsDir, filename), buffer);

	const asset = {
		id: crypto.randomUUID(),
		key,
		filename,
		type: type as 'image' | 'spritesheet' | 'audio',
	};

	// Parse spritesheet dimensions from form data
	if (type === 'spritesheet') {
		const fw = formData.get('frameWidth');
		const fh = formData.get('frameHeight');
		if (fw) (asset as any).frameWidth = parseInt(fw as string, 10);
		if (fh) (asset as any).frameHeight = parseInt(fh as string, 10);
	}

	return json(asset, { status: 201 });
};
