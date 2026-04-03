/**
 * Server-side app state — plain TypeScript, no Svelte runes.
 *
 * This module mirrors the client-side stores but uses plain variables
 * so it can run in hooks.server.ts (which is not processed by the
 * Svelte compiler).
 */
import type { Project, Scene, Module, GameObject, Command } from '$lib/types.js';
import { DEFAULT_CONFIG } from '$lib/constants.js';

// ---------------------------------------------------------------------------
// Project state
// ---------------------------------------------------------------------------
let project: Project = {
	name: '',
	config: { ...DEFAULT_CONFIG },
	scenes: [],
	modules: [],
};

function loadProject(p: Project) {
	project = {
		name: p.name,
		config: { ...p.config },
		scenes: p.scenes.map((s) => ({ ...s, objects: [...s.objects] })),
		modules: p.modules.map((m) => ({ ...m })),
	};
}

function getProject(): Project {
	return project;
}

function getScene(id: string): Scene | undefined {
	return project.scenes.find((s) => s.id === id);
}

function getModule(id: string): Module | undefined {
	return project.modules.find((m) => m.id === id);
}

function getObject(id: string): GameObject | undefined {
	for (const scene of project.scenes) {
		const obj = scene.objects.find((o) => o.id === id);
		if (obj) return obj;
	}
	return undefined;
}

function getObjectScene(objectId: string): Scene | undefined {
	return project.scenes.find((s) => s.objects.some((o) => o.id === objectId));
}

// ---------------------------------------------------------------------------
// Selection state
// ---------------------------------------------------------------------------
let selectedIds: string[] = [];

function getSelectedIds(): string[] {
	return selectedIds;
}

function setSelectedIds(ids: string[]) {
	selectedIds = ids;
}

// ---------------------------------------------------------------------------
// History (undo/redo stack) — plain implementation
// ---------------------------------------------------------------------------
let stack: Command[] = [];
let cursor = 0;

function historyExecute(cmd: Command) {
	cmd.execute();
	stack = stack.slice(0, cursor);
	stack.push(cmd);
	cursor = stack.length;
}

function historyUndo(): Command | undefined {
	if (cursor <= 0) return undefined;
	cursor--;
	const cmd = stack[cursor];
	cmd.undo();
	return cmd;
}

function historyRedo(): Command | undefined {
	if (cursor >= stack.length) return undefined;
	const cmd = stack[cursor];
	cmd.execute();
	cursor++;
	return cmd;
}

export const serverHistory = {
	execute: historyExecute,
	undo: historyUndo,
	redo: historyRedo,
};

export const serverProject = {
	get project() {
		return getProject();
	},
	load: loadProject,
	getScene,
	getModule,
	getObject,
	getObjectScene,
};

export const serverSelection = {
	get selectedIds() {
		return getSelectedIds();
	},
	set: setSelectedIds,
};
