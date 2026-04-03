export interface ProjectConfig {
	width: number;
	height: number;
	physics: string;
	pixelArt: boolean;
	backgroundColor: string;
}

export interface GameObject {
	id: string;
	name: string;
	objType: string;
	x: number;
	y: number;
	w: number;
	h: number;
	color: string;
	visible: boolean;
	locked: boolean;
	props: Record<string, string | number | boolean>;
}

export interface Scene {
	id: string;
	name: string;
	description: string;
	objects: GameObject[];
	code: string;
}

export interface Module {
	id: string;
	name: string;
	description: string;
	code: string;
}

export interface Project {
	name: string;
	config: ProjectConfig;
	scenes: Scene[];
	modules: Module[];
}

export type CommandSource = 'user' | 'mcp';

export interface Command {
	id: string;
	type: string;
	description: string;
	source: CommandSource;
	execute(): void;
	undo(): void;
}

export type ViewMode = 'edit' | 'play' | 'code';

export interface ObjTypeMeta {
	label: string;
	color: string;
	icon: string;
}
