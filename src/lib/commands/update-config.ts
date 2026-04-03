import type { Command, CommandSource, ProjectConfig, Project } from '$lib/types.js';

export function createUpdateConfigCommand(
	getProject: () => Project,
	prop: keyof ProjectConfig,
	value: ProjectConfig[keyof ProjectConfig],
	source: CommandSource,
): Command {
	const from = getProject().config[prop];

	return {
		id: crypto.randomUUID(),
		type: 'update_config',
		description: `Set config.${prop} = ${JSON.stringify(value)}`,
		source,
		execute() { (getProject().config as any)[prop] = value; },
		undo() { (getProject().config as any)[prop] = from; },
	};
}
