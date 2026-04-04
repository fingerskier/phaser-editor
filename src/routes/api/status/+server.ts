import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { serverSaveStatus } from '$lib/server/state.js';

export const GET: RequestHandler = async () => {
	return json({
		saved: serverSaveStatus.isSaved(),
		version: serverSaveStatus.getVersion(),
		externalVersion: serverSaveStatus.getExternalChangeVersion(),
	});
};
