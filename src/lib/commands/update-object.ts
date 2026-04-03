import type { Command, CommandSource, GameObject } from '$lib/types.js';

export function createUpdateObjectCommand(
	getObject: (id: string) => GameObject | undefined,
	objectId: string,
	prop: string,
	value: unknown,
	source: CommandSource,
): Command {
	const obj = getObject(objectId);
	if (!obj) throw new Error(`Object ${objectId} not found`);
	const isCoreProp = prop in obj && prop !== 'props';
	const from = isCoreProp ? (obj as any)[prop] : obj.props[prop];

	return {
		id: crypto.randomUUID(),
		type: 'update_object',
		description: `Set ${obj.name}.${prop} = ${JSON.stringify(value)}`,
		source,
		execute() {
			const target = getObject(objectId)!;
			if (isCoreProp) { (target as any)[prop] = value; }
			else { target.props[prop] = value as string | number | boolean; }
		},
		undo() {
			const target = getObject(objectId)!;
			if (isCoreProp) { (target as any)[prop] = from; }
			else {
				if (from === undefined) delete target.props[prop];
				else target.props[prop] = from as string | number | boolean;
			}
		},
	};
}
