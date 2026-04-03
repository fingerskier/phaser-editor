<script lang="ts">
	import type { ProjectConfig } from '$lib/types.js';

	let {
		sceneName = '',
		objectCount = 0,
		config,
		historyDepth = 0,
		saved = true,
	}: {
		sceneName: string;
		objectCount: number;
		config: ProjectConfig;
		historyDepth: number;
		saved: boolean;
	} = $props();
</script>

<div class="status-bar">
	<span class="seg">
		<span class="label">Scene:</span>
		<span class="value">{sceneName}</span>
	</span>
	<span class="divider">|</span>
	<span class="seg">
		<span class="label">Objects:</span>
		<span class="value">{objectCount}</span>
	</span>
	<span class="divider">|</span>
	<span class="seg">
		<span class="label">Canvas:</span>
		<span class="value">{config.width}x{config.height}</span>
	</span>
	<span class="divider">|</span>
	<span class="seg">
		<span class="label">Physics:</span>
		<span class="value">{config.physics}</span>
	</span>
	<span class="divider">|</span>
	<span class="seg">
		<span class="label">History:</span>
		<span class="value">{historyDepth}</span>
	</span>
	<span class="spacer"></span>
	<span class="save-status" class:saved class:unsaved={!saved}>
		{saved ? '&#x2714; Saved' : '&#x25CF; Unsaved'}
	</span>
</div>

<style>
	.status-bar {
		display: flex;
		align-items: center;
		padding: 0 12px;
		background: var(--bg-tertiary);
		border-top: 1px solid var(--border);
		font-size: 10px;
		color: var(--text-muted);
		gap: 6px;
		overflow: hidden;
		white-space: nowrap;
	}

	.seg {
		display: flex;
		gap: 3px;
		align-items: center;
	}

	.label {
		color: var(--text-muted);
	}

	.value {
		color: var(--text-secondary);
	}

	.divider {
		color: var(--border);
	}

	.spacer {
		flex: 1;
	}

	.save-status {
		font-size: 10px;
	}

	.save-status.saved {
		color: var(--accent-green);
	}

	.save-status.unsaved {
		color: var(--accent-yellow);
	}
</style>
