<script lang="ts">
	import type { ViewMode } from '$lib/types.js';

	let {
		projectName = '',
		viewMode = $bindable<ViewMode>('edit'),
		canUndo = false,
		canRedo = false,
		mcpConnected = false,
		onUndo,
		onRedo,
	}: {
		projectName: string;
		viewMode: ViewMode;
		canUndo: boolean;
		canRedo: boolean;
		mcpConnected: boolean;
		onUndo: () => void;
		onRedo: () => void;
	} = $props();
</script>

<div class="toolbar" style="display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:var(--bg-tertiary);border-bottom:1px solid var(--border);">
	<div style="display:flex;gap:16px;align-items:center;">
		<span style="color:var(--accent-green);font-weight:bold;">&#x2B21; Phaser Editor</span>
		<span style="color:var(--text-secondary);">{projectName}</span>
	</div>
	<div style="display:flex;gap:4px;">
		<button class:active={viewMode === 'edit'} onclick={() => viewMode = 'edit'}>EDIT</button>
		<button class:active={viewMode === 'play'} onclick={() => viewMode = 'play'}>PLAY</button>
		<button class:active={viewMode === 'code'} onclick={() => viewMode = 'code'}>CODE</button>
	</div>
	<div style="display:flex;gap:12px;align-items:center;">
		<button disabled={!canUndo} onclick={onUndo}>&#x21A9; Undo</button>
		<button disabled={!canRedo} onclick={onRedo}>&#x21AA; Redo</button>
		<span style="font-size:10px;color:{mcpConnected ? 'var(--accent-green)' : 'var(--text-muted)'};">&#x25CF; {mcpConnected ? 'MCP Connected' : 'MCP Disconnected'}</span>
	</div>
</div>
