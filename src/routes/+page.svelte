<script lang="ts">
	import { onMount } from 'svelte';
	import type { ViewMode } from '$lib/types.js';
	import { projectStore } from '$lib/stores/project.svelte.js';
	import { selectionStore } from '$lib/stores/selection.svelte.js';
	import { historyStore } from '$lib/stores/history.svelte.js';
	import { createCommandBus } from '$lib/commands/command-bus.js';
	import { createUpdateObjectCommand } from '$lib/commands/update-object.js';
	import CodeEditor from '../components/CodeEditor.svelte';
	import { createUpdateCodeCommand } from '$lib/commands/update-code.js';
	import Toolbar from '../components/Toolbar.svelte';
	import SceneTree from '../components/SceneTree.svelte';
	import PhaserCanvas from '../components/PhaserCanvas.svelte';
	import SelectionOverlay from '../components/SelectionOverlay.svelte';
	import PropertiesPanel from '../components/PropertiesPanel.svelte';
	import StatusBar from '../components/StatusBar.svelte';

	const store = projectStore();
	const selection = selectionStore();
	const history = historyStore();
	const bus = createCommandBus(history);

	let viewMode = $state<ViewMode>('edit');
	let activeSceneId = $state('');
	let mcpConnected = $state(false);

	let activeScene = $derived(store.getScene(activeSceneId));
	let selectedObject = $derived(
		selection.selectedIds.length === 1
			? store.getObject(selection.selectedIds[0]) ?? null
			: null
	);

	onMount(async () => {
		const res = await fetch('/api/project');
		const project = await res.json();
		store.load(project);
		if (project.scenes.length > 0) activeSceneId = project.scenes[0].id;
	});

	function handleSelectScene(id: string) { activeSceneId = id; selection.clear(); }

	function handleSelectObject(id: string, multi = false) {
		if (!id) { selection.clear(); return; }
		if (multi) selection.toggleSelect(id);
		else selection.select(id);
	}

	function handleMoveObject(id: string, x: number, y: number) {
		const cmdX = createUpdateObjectCommand(store.getObject.bind(store), id, 'x', Math.round(x), 'user');
		bus.execute(cmdX);
		const cmdY = createUpdateObjectCommand(store.getObject.bind(store), id, 'y', Math.round(y), 'user');
		bus.execute(cmdY);
	}

	function handleUpdateProperty(objectId: string, prop: string, value: unknown) {
		const cmd = createUpdateObjectCommand(store.getObject.bind(store), objectId, prop, value, 'user');
		bus.execute(cmd);
	}
</script>

<div class="editor-layout">
	<Toolbar
		projectName={store.project.name}
		bind:viewMode
		canUndo={history.canUndo}
		canRedo={history.canRedo}
		{mcpConnected}
		onUndo={() => bus.undo()}
		onRedo={() => bus.redo()}
	/>

	<SceneTree
		project={store.project}
		{activeSceneId}
		selectedObjectIds={selection.selectedIds}
		onSelectScene={handleSelectScene}
		onSelectObject={(id) => handleSelectObject(id)}
	/>

	<div class="center-panel" style="position:relative;overflow:hidden;">
		{#if viewMode === 'edit' && activeScene}
			<PhaserCanvas config={store.project.config} objects={activeScene.objects} {viewMode} />
			<SelectionOverlay
				objects={activeScene.objects}
				selectedIds={selection.selectedIds}
				canvasRect={{ left: 0, top: 0, width: store.project.config.width, height: store.project.config.height }}
				onSelect={handleSelectObject}
				onMove={handleMoveObject}
			/>
		{:else if viewMode === 'code' && activeScene}
			<CodeEditor
				code={activeScene.code}
				onCodeChange={(newCode) => {
					if (activeScene) {
						const cmd = createUpdateCodeCommand(
							(id) => store.getScene(id) ?? store.getModule(id),
							activeScene.id,
							newCode,
							'user'
						);
						bus.execute(cmd);
					}
				}}
			/>
		{:else if viewMode === 'play'}
			<div style="padding:16px;color:var(--text-secondary);">Play mode — full Phaser game</div>
		{:else}
			<div style="padding:16px;color:var(--text-muted);">No scene selected</div>
		{/if}
	</div>

	<PropertiesPanel {selectedObject} onUpdateProperty={handleUpdateProperty} />

	<StatusBar
		sceneName={activeScene?.name ?? ''}
		objectCount={activeScene?.objects.length ?? 0}
		config={store.project.config}
		historyDepth={history.depth}
		saved={true}
	/>
</div>

<style>
	.editor-layout {
		display: grid;
		grid-template-columns: 220px 1fr 260px;
		grid-template-rows: 40px 1fr 24px;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.editor-layout > :global(.toolbar) {
		grid-column: 1 / -1;
	}

	.editor-layout > :global(.scene-tree) {
		grid-row: 2;
		grid-column: 1;
		overflow-y: auto;
		border-right: 1px solid var(--border);
	}

	.center-panel {
		grid-row: 2;
		grid-column: 2;
		display: flex;
		flex-direction: column;
	}

	.editor-layout > :global(.properties-panel) {
		grid-row: 2;
		grid-column: 3;
		overflow-y: auto;
		border-left: 1px solid var(--border);
	}

	.editor-layout > :global(.status-bar) {
		grid-column: 1 / -1;
	}
</style>
