<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createPhaserBridge, type PhaserBridge } from '$lib/phaser/bridge.js';
	import type { ProjectConfig, GameObject } from '$lib/types.js';

	let { config, objects = [] as GameObject[], viewMode = 'edit' }: {
		config: ProjectConfig; objects: GameObject[]; viewMode: string;
	} = $props();

	let container: HTMLDivElement;
	let bridge: PhaserBridge | null = null;

	onMount(() => { bridge = createPhaserBridge(container, config); bridge.start(); });
	onDestroy(() => { bridge?.destroy(); });

	$effect(() => { bridge?.syncObjects(objects); });
</script>

<div style="position:relative;flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);">
	<div bind:this={container} style="position:relative;"></div>
</div>
