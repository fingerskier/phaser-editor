import { describe, it, expect, vi } from 'vitest';
import type { Command } from '$lib/types.js';

// Plain-object version of historyStore for testing (no runes needed)
function historyStore() {
	let stack: Command[] = [];
	let cursor = 0;

	function execute(cmd: Command) {
		cmd.execute();
		stack = stack.slice(0, cursor);
		stack.push(cmd);
		cursor = stack.length;
	}

	function undo(): Command | undefined {
		if (cursor <= 0) return undefined;
		cursor--;
		const cmd = stack[cursor];
		cmd.undo();
		return cmd;
	}

	function redo(): Command | undefined {
		if (cursor >= stack.length) return undefined;
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
		get canUndo() { return cursor > 0; },
		get canRedo() { return cursor < stack.length; },
		get depth() { return cursor; },
		get stack() { return stack; },
		execute,
		undo,
		redo,
		clear,
	};
}

function makeCommand(id: string, executeFn: () => void, undoFn: () => void): Command {
	return {
		id,
		type: 'test',
		description: `cmd-${id}`,
		source: 'user',
		execute: executeFn,
		undo: undoFn,
	};
}

describe('historyStore', () => {
	it('starts empty with canUndo/canRedo false', () => {
		const store = historyStore();
		expect(store.canUndo).toBe(false);
		expect(store.canRedo).toBe(false);
		expect(store.depth).toBe(0);
		expect(store.stack).toHaveLength(0);
	});

	it('execute makes canUndo true, undo reverses', () => {
		const store = historyStore();
		let value = 0;
		const cmd = makeCommand('1', () => { value = 1; }, () => { value = 0; });

		store.execute(cmd);
		expect(value).toBe(1);
		expect(store.canUndo).toBe(true);
		expect(store.depth).toBe(1);

		const undone = store.undo();
		expect(value).toBe(0);
		expect(undone).toBe(cmd);
		expect(store.canUndo).toBe(false);
	});

	it('undo makes canRedo true, redo re-applies', () => {
		const store = historyStore();
		let value = 0;
		const cmd = makeCommand('1', () => { value = 10; }, () => { value = 0; });

		store.execute(cmd);
		store.undo();
		expect(store.canRedo).toBe(true);

		const redone = store.redo();
		expect(value).toBe(10);
		expect(redone).toBe(cmd);
		expect(store.canRedo).toBe(false);
	});

	it('new command after undo truncates redo stack', () => {
		const store = historyStore();
		let value = 0;
		const cmd1 = makeCommand('1', () => { value = 1; }, () => { value = 0; });
		const cmd2 = makeCommand('2', () => { value = 2; }, () => { value = 1; });
		const cmd3 = makeCommand('3', () => { value = 3; }, () => { value = 0; });

		store.execute(cmd1);
		store.execute(cmd2);
		expect(store.depth).toBe(2);

		store.undo(); // undo cmd2, cursor=1
		expect(store.canRedo).toBe(true);

		store.execute(cmd3); // should truncate cmd2 from stack
		expect(store.depth).toBe(2);
		expect(store.stack).toHaveLength(2);
		expect(store.canRedo).toBe(false);
		expect(value).toBe(3);
	});

	it('clear resets everything', () => {
		const store = historyStore();
		const cmd = makeCommand('1', () => {}, () => {});
		store.execute(cmd);
		store.clear();
		expect(store.canUndo).toBe(false);
		expect(store.canRedo).toBe(false);
		expect(store.depth).toBe(0);
		expect(store.stack).toHaveLength(0);
	});
});
