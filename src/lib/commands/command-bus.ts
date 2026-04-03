import type { Command } from '$lib/types.js';

interface HistoryLike {
	execute(cmd: Command): void;
	undo(): Command | undefined;
	redo(): Command | undefined;
}

export function createCommandBus(history: HistoryLike) {
	const listeners: Array<(cmd: Command) => void> = [];

	function execute(cmd: Command) {
		history.execute(cmd);
		for (const fn of listeners) fn(cmd);
	}

	function undo() { return history.undo(); }
	function redo() { return history.redo(); }

	function onExecute(fn: (cmd: Command) => void) {
		listeners.push(fn);
		return () => {
			const idx = listeners.indexOf(fn);
			if (idx >= 0) listeners.splice(idx, 1);
		};
	}

	return { execute, undo, redo, onExecute };
}

export type CommandBus = ReturnType<typeof createCommandBus>;
