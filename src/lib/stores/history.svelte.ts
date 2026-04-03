import type { Command } from '$lib/types.js';

export function historyStore() {
	let stack = $state<Command[]>([]);
	let cursor = $state(0);
	let canUndo = $derived(cursor > 0);
	let canRedo = $derived(cursor < stack.length);

	function execute(cmd: Command) {
		cmd.execute();
		stack = stack.slice(0, cursor);
		stack.push(cmd);
		cursor = stack.length;
	}

	function undo(): Command | undefined {
		if (!canUndo) return undefined;
		cursor--;
		const cmd = stack[cursor];
		cmd.undo();
		return cmd;
	}

	function redo(): Command | undefined {
		if (!canRedo) return undefined;
		const cmd = stack[cursor];
		cmd.execute();
		cursor++;
		return cmd;
	}

	function clear() {
		stack = [];
		cursor = 0;
	}

	return {
		get canUndo() {
			return canUndo;
		},
		get canRedo() {
			return canRedo;
		},
		get depth() {
			return cursor;
		},
		get stack() {
			return stack;
		},
		execute,
		undo,
		redo,
		clear,
	};
}
