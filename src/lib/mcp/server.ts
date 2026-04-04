import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CommandBus } from '$lib/commands/command-bus.js';
import type { Project, GameObject, Scene, Module } from '$lib/types.js';
import { createReadToolHandlers } from './tools/read-tools.js';
import { createWriteToolHandlers, type StoreAccessors } from './tools/write-tools.js';
import { generateExportFiles } from '$lib/export/generate-project.js';
import { serverScreenshot, serverRestart } from '$lib/server/state.js';

export interface ServerDeps {
	bus: CommandBus;
	getProject: () => Project;
	getSelectedIds: () => string[];
	getObject: (id: string) => GameObject | undefined;
	getScene: (id: string) => Scene | undefined;
	getObjectScene: (objectId: string) => Scene | undefined;
	getTarget: (id: string) => Scene | Module | undefined;
}

let singleton: McpServer | null = null;

export function initEditorMcpServer(deps: ServerDeps): McpServer {
	const server = new McpServer(
		{ name: 'phaser-editor', version: '1.0.0' },
		{ capabilities: { tools: {} } },
	);

	const readTools = createReadToolHandlers(
		deps.getProject,
		deps.getSelectedIds,
		deps.getObject,
	);

	const accessors: StoreAccessors = {
		getProject: deps.getProject,
		getScene: deps.getScene,
		getObject: deps.getObject,
		getObjectScene: deps.getObjectScene,
		getTarget: deps.getTarget,
	};
	const writeTools = createWriteToolHandlers(deps.bus, accessors);

	// --- Read tools ---

	server.registerTool('get_project', {
		title: 'Get Project',
		description: 'Returns the project summary including scenes and modules',
	}, async () => {
		return { content: [{ type: 'text', text: JSON.stringify(readTools.get_project(), null, 2) }] };
	});

	server.registerTool('get_scene_tree', {
		title: 'Get Scene Tree',
		description: 'Returns the object tree for a scene',
		inputSchema: { sceneId: z.string() },
	}, async ({ sceneId }) => {
		const result = readTools.get_scene_tree(sceneId);
		if (!result) return { content: [{ type: 'text', text: 'Scene not found' }], isError: true };
		return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
	});

	server.registerTool('get_selection', {
		title: 'Get Selection',
		description: 'Returns the currently selected objects',
	}, async () => {
		return { content: [{ type: 'text', text: JSON.stringify(readTools.get_selection(), null, 2) }] };
	});

	server.registerTool('get_object', {
		title: 'Get Object',
		description: 'Returns a game object by ID',
		inputSchema: { objectId: z.string() },
	}, async ({ objectId }) => {
		const result = readTools.get_object(objectId);
		if (!result) return { content: [{ type: 'text', text: 'Object not found' }], isError: true };
		return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
	});

	// --- Write tools ---

	server.registerTool('add_object', {
		title: 'Add Object',
		description: 'Add a new game object to a scene',
		inputSchema: {
			sceneId: z.string(),
			type: z.string(),
			name: z.string(),
			x: z.number(),
			y: z.number(),
			w: z.number().optional(),
			h: z.number().optional(),
			props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
		},
	}, async ({ sceneId, type, name, x, y, w, h, props }) => {
		const obj: GameObject = {
			id: crypto.randomUUID(),
			name,
			objType: type,
			x, y,
			w: w ?? 50,
			h: h ?? 50,
			color: '#4a7dff',
			visible: true,
			locked: false,
			props: (props ?? {}) as Record<string, string | number | boolean>,
		};
		writeTools.add_object(sceneId, obj);
		return { content: [{ type: 'text', text: JSON.stringify({ id: obj.id, name: obj.name }) }] };
	});

	server.registerTool('update_object', {
		title: 'Update Object',
		description: 'Update properties of a game object',
		inputSchema: {
			objectId: z.string(),
			props: z.record(z.string(), z.unknown()),
		},
	}, async ({ objectId, props }) => {
		writeTools.update_object(objectId, props);
		return { content: [{ type: 'text', text: `Updated ${objectId}` }] };
	});

	server.registerTool('remove_object', {
		title: 'Remove Object',
		description: 'Remove a game object from its scene',
		inputSchema: { objectId: z.string() },
	}, async ({ objectId }) => {
		writeTools.remove_object(objectId);
		return { content: [{ type: 'text', text: `Removed ${objectId}` }] };
	});

	server.registerTool('update_scene_code', {
		title: 'Update Scene Code',
		description: 'Update the code for a scene or module',
		inputSchema: { sceneId: z.string(), code: z.string() },
	}, async ({ sceneId, code }) => {
		writeTools.update_scene_code(sceneId, code);
		return { content: [{ type: 'text', text: `Code updated for ${sceneId}` }] };
	});

	server.registerTool('add_scene', {
		title: 'Add Scene',
		description: 'Create a new scene',
		inputSchema: {
			name: z.string(),
			description: z.string().optional(),
		},
	}, async ({ name, description }) => {
		const scene = writeTools.add_scene(name, description);
		return { content: [{ type: 'text', text: JSON.stringify({ id: scene.id, name: scene.name }) }] };
	});

	server.registerTool('remove_scene', {
		title: 'Remove Scene',
		description: 'Remove a scene from the project',
		inputSchema: { sceneId: z.string() },
	}, async ({ sceneId }) => {
		writeTools.remove_scene(sceneId);
		return { content: [{ type: 'text', text: `Removed scene ${sceneId}` }] };
	});

	server.registerTool('update_config', {
		title: 'Update Config',
		description: 'Update project configuration properties',
		inputSchema: {
			props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
		},
	}, async ({ props }) => {
		writeTools.update_config(props as any);
		return { content: [{ type: 'text', text: `Config updated` }] };
	});

	server.registerTool('undo', {
		title: 'Undo',
		description: 'Undo the last command',
	}, async () => {
		const cmd = writeTools.undo();
		return { content: [{ type: 'text', text: cmd ? `Undid: ${cmd.description}` : 'Nothing to undo' }] };
	});

	server.registerTool('redo', {
		title: 'Redo',
		description: 'Redo the last undone command',
	}, async () => {
		const cmd = writeTools.redo();
		return { content: [{ type: 'text', text: cmd ? `Redid: ${cmd.description}` : 'Nothing to redo' }] };
	});

	server.registerTool('reorder_object', {
		title: 'Reorder Object',
		description: 'Change the z-order of an object within its scene (affects render layering)',
		inputSchema: {
			objectId: z.string(),
			direction: z.enum(['up', 'down', 'front', 'back']).describe('up=one step forward, down=one step back, front=topmost, back=bottommost'),
		},
	}, async ({ objectId, direction }) => {
		writeTools.reorder_object(objectId, direction as any);
		return { content: [{ type: 'text', text: `Moved ${objectId} ${direction}` }] };
	});

	server.registerTool('list_assets', {
		title: 'List Assets',
		description: 'List all assets in the project',
	}, async () => {
		const assets = writeTools.list_assets();
		return { content: [{ type: 'text', text: JSON.stringify(assets, null, 2) }] };
	});

	server.registerTool('add_asset', {
		title: 'Add Asset',
		description: 'Register an asset in the project (file must already exist in assets/ dir)',
		inputSchema: {
			key: z.string().describe('Unique key to reference this asset in game objects'),
			filename: z.string().describe('Filename in assets/ directory'),
			type: z.enum(['image', 'spritesheet', 'audio']),
			frameWidth: z.number().optional().describe('Spritesheet frame width'),
			frameHeight: z.number().optional().describe('Spritesheet frame height'),
		},
	}, async ({ key, filename, type, frameWidth, frameHeight }) => {
		const asset = {
			id: crypto.randomUUID(),
			key,
			filename,
			type,
			frameWidth,
			frameHeight,
		};
		writeTools.add_asset(asset);
		return { content: [{ type: 'text', text: JSON.stringify({ id: asset.id, key: asset.key }) }] };
	});

	server.registerTool('remove_asset', {
		title: 'Remove Asset',
		description: 'Remove an asset from the project registry',
		inputSchema: { assetId: z.string() },
	}, async ({ assetId }) => {
		writeTools.remove_asset(assetId);
		return { content: [{ type: 'text', text: `Removed asset ${assetId}` }] };
	});

	server.registerTool('restart_preview', {
		title: 'Restart Preview',
		description: 'Restart the Phaser canvas preview in the editor (requires browser open)',
	}, async () => {
		serverRestart.request();
		return { content: [{ type: 'text', text: 'Preview restart signal sent to editor' }] };
	});

	server.registerTool('get_screenshot', {
		title: 'Get Screenshot',
		description: 'Capture a screenshot of the current game preview (requires editor open in browser)',
	}, async () => {
		const data = await serverScreenshot.request();
		if (!data) {
			return { content: [{ type: 'text', text: 'Screenshot capture timed out. Is the editor open in a browser?' }], isError: true };
		}
		// Return as base64 image
		const base64 = data.replace(/^data:image\/png;base64,/, '');
		return { content: [{ type: 'image', data: base64, mimeType: 'image/png' }] };
	});

	server.registerTool('export_project', {
		title: 'Export Project',
		description: 'Generate a standalone Phaser project. Returns the list of generated files and their contents.',
	}, async () => {
		const project = deps.getProject();
		const files = generateExportFiles(project);
		const summary = files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');
		return { content: [{ type: 'text', text: summary }] };
	});

	singleton = server;
	return server;
}

export function getEditorMcpServer(): McpServer {
	if (!singleton) throw new Error('MCP server not initialized. Call initEditorMcpServer first.');
	return singleton;
}
