import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { serverScreenshot } from '$lib/server/state.js';

// Client polls this to check if a screenshot is requested
export const GET: RequestHandler = async () => {
	return json({ requested: serverScreenshot.isRequested() });
};

// Client sends captured screenshot data
export const POST: RequestHandler = async ({ request }) => {
	const { data } = await request.json();
	if (typeof data === 'string') {
		serverScreenshot.fulfill(data);
		return json({ ok: true });
	}
	return json({ error: 'data required' }, { status: 400 });
};
