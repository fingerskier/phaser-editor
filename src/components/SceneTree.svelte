<script lang="ts">
	import type { Project, GameObject } from '$lib/types.js';
	import { OBJ_TYPES } from '$lib/constants.js';

	let {
		project,
		activeSceneId = '',
		selectedObjectIds = [],
		onSelectScene,
		onSelectObject,
	}: {
		project: Project;
		activeSceneId: string;
		selectedObjectIds: string[];
		onSelectScene: (sceneId: string) => void;
		onSelectObject: (objectId: string) => void;
	} = $props();

	let expandedScenes = $state<Record<string, boolean>>({});

	function toggleScene(sceneId: string) {
		expandedScenes[sceneId] = !expandedScenes[sceneId];
	}

	function getObjMeta(objType: string) {
		return OBJ_TYPES[objType] ?? { label: objType, color: '#999', icon: '?' };
	}

	function handleSceneClick(sceneId: string) {
		onSelectScene(sceneId);
		expandedScenes[sceneId] = expandedScenes[sceneId] ?? true;
	}

	function handleObjectClick(e: MouseEvent, obj: GameObject) {
		e.stopPropagation();
		onSelectObject(obj.id);
	}
</script>

<div class="panel scene-tree">
	<div class="panel-header">Scenes & Objects</div>

	{#each project.scenes as scene (scene.id)}
		<div>
			<!-- Scene row -->
			<div
				class="scene-row"
				class:active-scene={scene.id === activeSceneId}
				onclick={() => handleSceneClick(scene.id)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && handleSceneClick(scene.id)}
			>
				<span
					class="expand-icon"
					onclick={(e) => { e.stopPropagation(); toggleScene(scene.id); }}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && toggleScene(scene.id)}
				>
					{expandedScenes[scene.id] ? '&#x25BE;' : '&#x25B8;'}
				</span>
				<span class="scene-icon">&#x25A3;</span>
				<span class="scene-name">{scene.name}</span>
				<span class="obj-count">{scene.objects.length}</span>
			</div>

			<!-- Objects list (collapsible) -->
			{#if expandedScenes[scene.id]}
				{#each scene.objects as obj (obj.id)}
					{@const meta = getObjMeta(obj.objType)}
					<div
						class="object-row"
						class:selected={selectedObjectIds.includes(obj.id)}
						class:hidden={!obj.visible}
						onclick={(e) => handleObjectClick(e, obj)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && onSelectObject(obj.id)}
					>
						<span class="obj-icon" style="color:{meta.color};">{meta.icon}</span>
						<span class="obj-name">{obj.name}</span>
						{#if obj.locked}
							<span class="lock-icon">&#x1F512;</span>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/each}

	{#if project.modules.length > 0}
		<div class="panel-header" style="margin-top:8px;">Modules</div>
		{#each project.modules as mod (mod.id)}
			<div class="module-row">
				<span class="obj-icon" style="color:var(--accent-blue);">&#x2395;</span>
				<span class="obj-name">{mod.name}</span>
			</div>
		{/each}
	{/if}
</div>

<style>
	.scene-row {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		cursor: pointer;
		font-size: 11px;
		color: var(--text-secondary);
		user-select: none;
	}

	.scene-row:hover {
		background: var(--bg-tertiary);
	}

	.scene-row.active-scene {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border-left: 2px solid var(--accent-green);
	}

	.expand-icon {
		width: 12px;
		font-size: 10px;
		color: var(--text-muted);
		cursor: pointer;
	}

	.scene-icon {
		color: var(--accent-yellow);
		font-size: 11px;
	}

	.scene-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.obj-count {
		font-size: 9px;
		color: var(--text-muted);
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1px 4px;
	}

	.object-row {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px 3px 28px;
		cursor: pointer;
		font-size: 11px;
		color: var(--text-secondary);
		user-select: none;
	}

	.object-row:hover {
		background: var(--bg-tertiary);
	}

	.object-row.selected {
		background: #1a2a3a;
		color: var(--text-primary);
		border-left: 2px solid var(--accent-blue);
	}

	.object-row.hidden {
		opacity: 0.4;
	}

	.obj-icon {
		font-size: 11px;
		width: 14px;
		text-align: center;
	}

	.obj-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.lock-icon {
		font-size: 9px;
	}

	.module-row {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		font-size: 11px;
		color: var(--text-secondary);
	}
</style>
