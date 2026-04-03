import type { Command, CommandSource, Scene, Module } from '$lib/types.js';

export function createUpdateCodeCommand(
	getTarget: (id: string) => Scene | Module | undefined,
	targetId: string,
	newCode: string,
	source: CommandSource,
): Command {
	const target = getTarget(targetId);
	if (!target) throw new Error(`Target ${targetId} not found`);
	const oldCode = target.code;

	return {
		id: crypto.randomUUID(),
		type: 'update_code',
		description: `Update code for "${target.name}"`,
		source,
		execute() { const t = getTarget(targetId); if (t) t.code = newCode; },
		undo() { const t = getTarget(targetId); if (t) t.code = oldCode; },
	};
}
