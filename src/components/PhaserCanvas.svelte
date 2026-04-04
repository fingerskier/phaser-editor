<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createPhaserBridge, type PhaserBridge } from '$lib/phaser/bridge.js';
	import type { ProjectConfig, GameObject, Asset } from '$lib/types.js';

	let { config, objects = [] as GameObject[], assets = [] as Asset[], viewMode = 'edit' }: {
		config: ProjectConfig; objects: GameObject[]; assets: Asset[]; viewMode: string;
	} = $props();

	let container: HTMLDivElement;
	let bridge: PhaserBridge | null = null;
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	async function checkScreenshotRequest() {
		try {
			const res = await fetch('/api/screenshot');
			const { requested } = await res.json();
			if (requested && bridge) {
				const data = bridge.screenshot();
				if (data) {
					await fetch('/api/screenshot', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ data }),
					});
				}
			}
		} catch { /* ignore polling errors */ }
	}

	onMount(() => {
		bridge = createPhaserBridge(container, config);
		bridge.start();
		pollInterval = setInterval(checkScreenshotRequest, 500);
	});
	onDestroy(() => {
		bridge?.destroy();
		if (pollInterval) clearInterval(pollInterval);
	});

	$effect(() => { bridge?.loadAssets(assets); });
	$effect(() => { bridge?.syncObjects(objects); });
</script>

<div style="position:relative;flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);">
	<div bind:this={container} style="position:relative;"></div>
</div>
