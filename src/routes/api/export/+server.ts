import type { RequestHandler } from './$types';
import { serverProject } from '$lib/server/state.js';
import { generateExportFiles } from '$lib/export/generate-project.js';
import { env } from '$env/dynamic/private';
import archiver from 'archiver';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { access } from 'node:fs/promises';
import { PassThrough } from 'node:stream';

export const POST: RequestHandler = async () => {
	const project = serverProject.project;
	if (!project.name) {
		return new Response('No project loaded', { status: 400 });
	}

	const files = generateExportFiles(project);
	const projectDir = env.PHASER_PROJECT_DIR || './sample-project';
	const archive = archiver('zip', { zlib: { level: 6 } });
	const passthrough = new PassThrough();
	archive.pipe(passthrough);

	// Add generated text files
	for (const file of files) {
		archive.append(file.content, { name: file.path });
	}

	// Add asset files from disk
	for (const asset of project.assets) {
		const assetPath = join(projectDir, 'assets', asset.filename);
		try {
			await access(assetPath);
			archive.append(createReadStream(assetPath), { name: `public/assets/${asset.filename}` });
		} catch {
			// Asset file missing on disk, skip
		}
	}

	archive.finalize();

	// Convert Node stream to Web ReadableStream
	const readable = new ReadableStream({
		start(controller) {
			passthrough.on('data', (chunk) => controller.enqueue(chunk));
			passthrough.on('end', () => controller.close());
			passthrough.on('error', (err) => controller.error(err));
		},
	});

	const safeName = project.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

	return new Response(readable, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${safeName}.zip"`,
		},
	});
};
