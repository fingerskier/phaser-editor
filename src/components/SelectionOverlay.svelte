<script lang="ts">
	import type { GameObject } from '$lib/types.js';

	let {
		objects = [] as GameObject[], selectedIds = [] as string[],
		canvasRect = { left: 0, top: 0, width: 800, height: 600 },
		onSelect, onMove,
	}: {
		objects: GameObject[]; selectedIds: string[];
		canvasRect: { left: number; top: number; width: number; height: number };
		onSelect: (id: string, multi: boolean) => void;
		onMove: (id: string, x: number, y: number) => void;
	} = $props();

	let dragging: { id: string; startX: number; startY: number; origX: number; origY: number } | null = $state(null);

	function handlePointerDown(e: PointerEvent, obj: GameObject) {
		e.stopPropagation();
		onSelect(obj.id, e.shiftKey);
		dragging = { id: obj.id, startX: e.clientX, startY: e.clientY, origX: obj.x, origY: obj.y };
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		const dx = e.clientX - dragging.startX;
		const dy = e.clientY - dragging.startY;
		onMove(dragging.id, dragging.origX + dx, dragging.origY + dy);
	}

	function handlePointerUp() { dragging = null; }
	function handleBackgroundClick() { onSelect('', false); }
</script>

<div style="position:absolute;inset:0;pointer-events:auto;cursor:default;"
	onpointermove={handlePointerMove} onpointerup={handlePointerUp} onclick={handleBackgroundClick}>
	{#each objects as obj}
		{#if obj.visible && !obj.locked}
			<div style="position:absolute;left:{obj.x - obj.w/2}px;top:{obj.y - obj.h/2}px;width:{obj.w}px;height:{obj.h}px;cursor:move;"
				onpointerdown={(e) => handlePointerDown(e, obj)}>
				{#if selectedIds.includes(obj.id)}
					<div style="position:absolute;inset:-2px;border:2px solid var(--accent-blue);border-radius:2px;pointer-events:none;">
						{#each [['top','left'],['top','right'],['bottom','left'],['bottom','right']] as [v,h]}
							<div style="position:absolute;{v}:-3px;{h}:-3px;width:6px;height:6px;background:var(--accent-blue);"></div>
						{/each}
					</div>
					<div style="position:absolute;top:-16px;left:0;color:var(--accent-blue);font-size:9px;white-space:nowrap;font-family:var(--font-mono);">{obj.name}</div>
				{/if}
			</div>
		{/if}
	{/each}
</div>
