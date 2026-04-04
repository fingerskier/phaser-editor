/**
 * Server-side app state — plain TypeScript, no Svelte runes.
 *
 * This module mirrors the client-side stores but uses plain variables
 * so it can run in hooks.server.ts (which is not processed by the
 * Svelte compiler).
 */
import type { Project, Scene, Module, GameObject, Asset, Command } from '$lib/types.js';
import { DEFAULT_CONFIG } from '$lib/constants.js';

// ---------------------------------------------------------------------------
// Project state
// ---------------------------------------------------------------------------
let project: Project = {
	name: '',
	config: { ...DEFAULT_CONFIG },
	scenes: [],
	modules: [],
	assets: [],
};

function loadProject(p: Project) {
	project = {
		name: p.name,
		config: { ...p.config },
		scenes: p.scenes.map((s) => ({ ...s, objects: [...s.objects] })),
		modules: p.modules.map((m) => ({ ...m })),
		assets: (p.assets ?? []).map((a) => ({ ...a })),
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

// ---------------------------------------------------------------------------
// Save status tracking
// ---------------------------------------------------------------------------
let dirty = false;
let saveVersion = 0;

function markDirty() {
	dirty = true;
	saveVersion++;
}

function markSaved() {
	dirty = false;
}

function isSaved(): boolean {
	return !dirty;
}

function getSaveVersion(): number {
	return saveVersion;
}

// Track external file changes — incremented when watcher detects edits
let externalChangeVersion = 0;

function bumpExternalChange() {
	externalChangeVersion++;
}

function getExternalChangeVersion(): number {
	return externalChangeVersion;
}

export const serverSaveStatus = {
	markDirty,
	markSaved,
	isSaved,
	getVersion: getSaveVersion,
	bumpExternalChange,
	getExternalChangeVersion,
};

// ---------------------------------------------------------------------------
// Screenshot request/response
// ---------------------------------------------------------------------------
let screenshotRequest = false;
let screenshotData: string | null = null;
let screenshotResolve: ((data: string | null) => void) | null = null;

function requestScreenshot(): Promise<string | null> {
	screenshotRequest = true;
	screenshotData = null;
	return new Promise((resolve) => {
		screenshotResolve = resolve;
		// Timeout after 5 seconds
		setTimeout(() => {
			if (screenshotResolve === resolve) {
				screenshotResolve = null;
				screenshotRequest = false;
				resolve(null);
			}
		}, 5000);
	});
}

function isScreenshotRequested(): boolean {
	return screenshotRequest;
}

function fulfillScreenshot(data: string) {
	screenshotData = data;
	screenshotRequest = false;
	if (screenshotResolve) {
		screenshotResolve(data);
		screenshotResolve = null;
	}
}

export const serverScreenshot = {
	request: requestScreenshot,
	isRequested: isScreenshotRequested,
	fulfill: fulfillScreenshot,
};

// ---------------------------------------------------------------------------
// Preview restart request
// ---------------------------------------------------------------------------
let restartRequested = false;

function requestRestart() {
	restartRequested = true;
}

function consumeRestart(): boolean {
	if (restartRequested) {
		restartRequested = false;
		return true;
	}
	return false;
}

export const serverRestart = {
	request: requestRestart,
	consume: consumeRestart,
};

export const serverSelection = {
	get selectedIds() {
		return getSelectedIds();
	},
	set: setSelectedIds,
};
