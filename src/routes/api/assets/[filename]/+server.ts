import type { RequestHandler } from './$types';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '$env/dynamic/private';

const MIME_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.mp3': 'audio/mpeg',
	'.ogg': 'audio/ogg',
	'.wav': 'audio/wav',
};

export const GET: RequestHandler = async ({ params }) => {
	const projectDir = env.PHASER_PROJECT_DIR || './sample-project';
	const filename = params.filename;

	// Prevent path traversal
	if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
		return new Response('Invalid filename', { status: 400 });
	}

	try {
		const data = await readFile(join(projectDir, 'assets', filename));
		const ext = '.' + filename.split('.').pop()?.toLowerCase();
		const contentType = MIME_TYPES[ext] || 'application/octet-stream';
		return new Response(data, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=3600',
			},
		});
	} catch {
		return new Response('Not found', { status: 404 });
	}
};
