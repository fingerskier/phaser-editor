import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { transpileTS } from '$lib/phaser/transpile.js';

export const POST: RequestHandler = async ({ request }) => {
	const { code } = await request.json();
	if (typeof code !== 'string') {
		return json({ error: 'code string required' }, { status: 400 });
	}
	try {
		const js = await transpileTS(code);
		return json({ js });
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Transpilation failed' }, { status: 422 });
	}
};
