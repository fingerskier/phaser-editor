<script lang="ts">
	import type { GameObject } from '$lib/types.js';

	let {
		objects = [] as GameObject[], selectedIds = [] as string[],
		canvasRect = { left: 0, top: 0, width: 800, height: 600 },
		onSelect, onMove, onResize,
	}: {
		objects: GameObject[]; selectedIds: string[];
		canvasRect: { left: number; top: number; width: number; height: number };
		onSelect: (id: string, multi: boolean) => void;
		onMove: (id: string, x: number, y: number) => void;
		onResize: (id: string, w: number, h: number) => void;
	} = $props();

	type DragState = {
		mode: 'move';
		id: string; startX: number; startY: number; origX: number; origY: number;
	} | {
		mode: 'resize';
		id: string; startX: number; startY: number;
		origW: number; origH: number; origX: number; origY: number;
		corner: string;
	};

	let dragging = $state<DragState | null>(null);

	function handlePointerDown(e: PointerEvent, obj: GameObject) {
		e.stopPropagation();
		onSelect(obj.id, e.shiftKey);
		dragging = { mode: 'move', id: obj.id, startX: e.clientX, startY: e.clientY, origX: obj.x, origY: obj.y };
	}

	function handleResizeDown(e: PointerEvent, obj: GameObject, corner: string) {
		e.stopPropagation();
		e.preventDefault();
		dragging = {
			mode: 'resize', id: obj.id, corner,
			startX: e.clientX, startY: e.clientY,
			origW: obj.w, origH: obj.h, origX: obj.x, origY: obj.y,
		};
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		const dx = e.clientX - dragging.startX;
		const dy = e.clientY - dragging.startY;

		if (dragging.mode === 'move') {
			onMove(dragging.id, dragging.origX + dx, dragging.origY + dy);
		} else {
			// Resize — corner determines which axes grow/shrink
			let newW = dragging.origW;
			let newH = dragging.origH;

			if (dragging.corner.includes('right')) newW = Math.max(8, dragging.origW + dx);
			if (dragging.corner.includes('left')) newW = Math.max(8, dragging.origW - dx);
			if (dragging.corner.includes('bottom')) newH = Math.max(8, dragging.origH + dy);
			if (dragging.corner.includes('top')) newH = Math.max(8, dragging.origH - dy);

			onResize(dragging.id, Math.round(newW), Math.round(newH));

			// Adjust position when dragging left/top edges (center-based coords)
			let newX = dragging.origX;
			let newY = dragging.origY;
			if (dragging.corner.includes('left')) newX = dragging.origX + (dragging.origW - newW) / 2;
			if (dragging.corner.includes('top')) newY = dragging.origY + (dragging.origH - newH) / 2;
			if (dragging.corner.includes('right')) newX = dragging.origX + (newW - dragging.origW) / 2;
			if (dragging.corner.includes('bottom')) newY = dragging.origY + (newH - dragging.origH) / 2;

			if (newX !== dragging.origX || newY !== dragging.origY) {
				onMove(dragging.id, Math.round(newX), Math.round(newY));
			}
		}
	}

	function handlePointerUp() { dragging = null; }
	function handleBackgroundClick() { onSelect('', false); }

	const CORNER_CURSORS: Record<string, string> = {
		'top-left': 'nwse-resize',
		'top-right': 'nesw-resize',
		'bottom-left': 'nesw-resize',
		'bottom-right': 'nwse-resize',
	};
</script>

<div style="position:absolute;inset:0;pointer-events:auto;cursor:default;"
	onpointermove={handlePointerMove} onpointerup={handlePointerUp} onclick={handleBackgroundClick}>
	{#each objects as obj}
		{#if obj.visible && !obj.locked}
			<div style="position:absolute;left:{obj.x - obj.w/2}px;top:{obj.y - obj.h/2}px;width:{obj.w}px;height:{obj.h}px;cursor:move;"
				onpointerdown={(e) => handlePointerDown(e, obj)}>
				{#if selectedIds.includes(obj.id)}
					<div style="position:absolute;inset:-2px;border:2px solid var(--accent-blue);border-radius:2px;pointer-events:none;"></div>
					{#each [['top','left'],['top','right'],['bottom','left'],['bottom','right']] as [v,h]}
						{@const corner = `${v}-${h}`}
						<div
							style="position:absolute;{v}:-4px;{h}:-4px;width:8px;height:8px;background:var(--accent-blue);cursor:{CORNER_CURSORS[corner]};pointer-events:auto;z-index:1;"
							onpointerdown={(e) => handleResizeDown(e, obj, corner)}
						></div>
					{/each}
					<div style="position:absolute;top:-16px;left:0;color:var(--accent-blue);font-size:9px;white-space:nowrap;font-family:var(--font-mono);pointer-events:none;">{obj.name}</div>
				{/if}
			</div>
		{/if}
	{/each}
</div>
