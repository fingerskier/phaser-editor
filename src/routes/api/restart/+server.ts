import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { serverRestart } from '$lib/server/state.js';

// Client polls this to check if a restart is requested
export const GET: RequestHandler = async () => {
	return json({ restart: serverRestart.consume() });
};
