import type { CommandBus } from '$lib/commands/command-bus.js';
import type { Project, Scene, Module, GameObject, ProjectConfig, Asset } from '$lib/types.js';
import { createUpdateObjectCommand } from '$lib/commands/update-object.js';
import { createAddObjectCommand } from '$lib/commands/add-object.js';
import { createRemoveObjectCommand } from '$lib/commands/remove-object.js';
import { createUpdateCodeCommand } from '$lib/commands/update-code.js';
import { createAddSceneCommand } from '$lib/commands/add-scene.js';
import { createRemoveSceneCommand } from '$lib/commands/remove-scene.js';
import { createUpdateConfigCommand } from '$lib/commands/update-config.js';
import { createAddAssetCommand } from '$lib/commands/add-asset.js';
import { createRemoveAssetCommand } from '$lib/commands/remove-asset.js';
import { createReorderObjectCommand, type ReorderDirection } from '$lib/commands/reorder-object.js';

export interface StoreAccessors {
	getProject: () => Project;
	getScene: (id: string) => Scene | undefined;
	getObject: (id: string) => GameObject | undefined;
	getObjectScene: (objectId: string) => Scene | undefined;
	getTarget: (id: string) => Scene | Module | undefined;
}

export function createWriteToolHandlers(bus: CommandBus, accessors: StoreAccessors) {
	return {
		update_object(objectId: string, props: Record<string, unknown>) {
			for (const [prop, value] of Object.entries(props)) {
				const cmd = createUpdateObjectCommand(accessors.getObject, objectId, prop, value, 'mcp');
				bus.execute(cmd);
			}
		},

		add_object(sceneId: string, object: GameObject) {
			const cmd = createAddObjectCommand(accessors.getScene, sceneId, object, 'mcp');
			bus.execute(cmd);
		},

		remove_object(objectId: string) {
			const scene = accessors.getObjectScene(objectId);
			if (!scene) throw new Error(`Object ${objectId} not in any scene`);
			const cmd = createRemoveObjectCommand(accessors.getScene, scene.id, objectId, 'mcp');
			bus.execute(cmd);
		},

		update_scene_code(sceneId: string, code: string) {
			const cmd = createUpdateCodeCommand(accessors.getTarget, sceneId, code, 'mcp');
			bus.execute(cmd);
		},

		add_scene(name: string, description = '') {
			const scene: Scene = {
				id: crypto.randomUUID(),
				name,
				description,
				objects: [],
				code: `class ${name} extends Phaser.Scene {\n\tconstructor() { super({ key: '${name}' }); }\n\tcreate() {}\n\tupdate() {}\n}`,
			};
			const cmd = createAddSceneCommand(() => accessors.getProject(), scene, 'mcp');
			bus.execute(cmd);
			return scene;
		},

		remove_scene(sceneId: string) {
			const cmd = createRemoveSceneCommand(() => accessors.getProject(), sceneId, 'mcp');
			bus.execute(cmd);
		},

		update_config(props: Partial<ProjectConfig>) {
			for (const [prop, value] of Object.entries(props)) {
				const cmd = createUpdateConfigCommand(
					() => accessors.getProject(),
					prop as keyof ProjectConfig,
					value as ProjectConfig[keyof ProjectConfig],
					'mcp',
				);
				bus.execute(cmd);
			}
		},

		add_asset(asset: Asset) {
			const cmd = createAddAssetCommand(() => accessors.getProject(), asset, 'mcp');
			bus.execute(cmd);
		},

		remove_asset(assetId: string) {
			const cmd = createRemoveAssetCommand(() => accessors.getProject(), assetId, 'mcp');
			bus.execute(cmd);
		},

		reorder_object(objectId: string, direction: ReorderDirection) {
			const scene = accessors.getObjectScene(objectId);
			if (!scene) throw new Error(`Object ${objectId} not in any scene`);
			const cmd = createReorderObjectCommand(accessors.getScene, scene.id, objectId, direction, 'mcp');
			bus.execute(cmd);
		},

		list_assets() {
			return accessors.getProject().assets ?? [];
		},

		undo() {
			return bus.undo();
		},

		redo() {
			return bus.redo();
		},
	};
}
