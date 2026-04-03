import { describe, it, expect, vi } from 'vitest';
import { createCommandBus } from '$lib/commands/command-bus.js';
import type { Command } from '$lib/types.js';

function makeCommand(id: string): Command {
	return {
		id,
		type: 'test',
		description: `cmd-${id}`,
		source: 'user',
		execute: vi.fn(),
		undo: vi.fn(),
	};
}

function makeHistory() {
	const executed: Command[] = [];
	let undone: Command | undefined;
	let redone: Command | undefined;

	return {
		execute(cmd: Command) { executed.push(cmd); },
		undo() { return undone; },
		redo() { return redone; },
		// helpers for test setup
		_setUndone(cmd: Command) { undone = cmd; },
		_setRedone(cmd: Command) { redone = cmd; },
		_executed: executed,
	};
}

describe('createCommandBus', () => {
	it('delegates execute to history', () => {
		const history = makeHistory();
		const bus = createCommandBus(history);
		const cmd = makeCommand('1');

		bus.execute(cmd);

		expect(history._executed).toHaveLength(1);
		expect(history._executed[0]).toBe(cmd);
	});

	it('notifies listeners on execute', () => {
		const history = makeHistory();
		const bus = createCommandBus(history);
		const listener = vi.fn();
		bus.onExecute(listener);

		const cmd = makeCommand('1');
		bus.execute(cmd);

		expect(listener).toHaveBeenCalledWith(cmd);
	});

	it('unsubscribe removes listener', () => {
		const history = makeHistory();
		const bus = createCommandBus(history);
		const listener = vi.fn();
		const unsub = bus.onExecute(listener);

		unsub();

		bus.execute(makeCommand('1'));
		expect(listener).not.toHaveBeenCalled();
	});

	it('delegates undo to history', () => {
		const history = makeHistory();
		const bus = createCommandBus(history);
		const cmd = makeCommand('1');
		history._setUndone(cmd);

		const result = bus.undo();
		expect(result).toBe(cmd);
	});

	it('delegates redo to history', () => {
		const history = makeHistory();
		const bus = createCommandBus(history);
		const cmd = makeCommand('1');
		history._setRedone(cmd);

		const result = bus.redo();
		expect(result).toBe(cmd);
	});
});
