import type { Handle } from '@sveltejs/kit';
import { initEditorMcpServer } from '$lib/mcp/server.js';
import { serverProject, serverSelection, serverHistory, serverSaveStatus } from '$lib/server/state.js';
import { createCommandBus } from '$lib/commands/command-bus.js';
import { loadProject } from '$lib/persistence/load-project.js';
import { debouncedSave } from '$lib/persistence/save-project.js';
import { watchProject } from '$lib/persistence/watcher.js';
import { env } from '$env/dynamic/private';

const bus = createCommandBus(serverHistory);

const projectDir = env.PHASER_PROJECT_DIR || './sample-project';

// Load project on startup
let reloadTimer: ReturnType<typeof setTimeout> | null = null;

loadProject(projectDir)
	.then((project) => {
		serverProject.load(project);
		console.log(`Loaded project "${project.name}" from ${projectDir}`);

		// Watch for external file changes
		watchProject(projectDir, (_filename) => {
			// Skip if we just saved (debounce window)
			if (!serverSaveStatus.isSaved()) return;

			// Debounce reload to avoid partial reads
			if (reloadTimer) clearTimeout(reloadTimer);
			reloadTimer = setTimeout(async () => {
				try {
					const updated = await loadProject(projectDir);
					serverProject.load(updated);
					serverSaveStatus.bumpExternalChange();
					console.log('Reloaded project from external change');
				} catch (e) {
					console.warn('Failed to reload after external change:', e);
				}
			}, 300);
		});
	})
	.catch(() => {
		console.warn('No project found at', projectDir, '— starting empty');
	});

// Persist on every command
bus.onExecute(() => {
	serverSaveStatus.markDirty();
	debouncedSave(projectDir, serverProject.project, 500, () => {
		serverSaveStatus.markSaved();
	});
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
