import type { Handle } from '@sveltejs/kit';
import { initEditorMcpServer } from '$lib/mcp/server.js';
import { serverProject, serverSelection, serverHistory } from '$lib/server/state.js';
import { createCommandBus } from '$lib/commands/command-bus.js';
import { loadProject } from '$lib/persistence/load-project.js';
import { debouncedSave } from '$lib/persistence/save-project.js';
import { env } from '$env/dynamic/private';

const bus = createCommandBus(serverHistory);

const projectDir = env.PHASER_PROJECT_DIR || './sample-project';

// Load project on startup
loadProject(projectDir)
	.then((project) => {
		serverProject.load(project);
		console.log(`Loaded project "${project.name}" from ${projectDir}`);
	})
	.catch(() => {
		console.warn('No project found at', projectDir, '— starting empty');
	});

// Persist on every command
bus.onExecute(() => {
	debouncedSave(projectDir, serverProject.project);
});

// Initialize MCP server singleton
initEditorMcpServer({
	bus,
	getProject: () => serverProject.project,
	getScene: (id) => serverProject.getScene(id),
	getObject: (id) => serverProject.getObject(id),
	getObjectScene: (id) => serverProject.getObjectScene(id),
	getTarget: (id) => serverProject.getScene(id) ?? serverProject.getModule(id),
	getSelectedIds: () => serverSelection.selectedIds,
});

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
