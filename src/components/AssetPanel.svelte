<script lang="ts">
	import type { Asset } from '$lib/types.js';

	let {
		assets = [],
		projectBaseUrl = '/api/assets',
		onAssetAdded,
		onAssetRemoved,
	}: {
		assets: Asset[];
		projectBaseUrl?: string;
		onAssetAdded: (asset: Asset) => void;
		onAssetRemoved: (assetId: string) => void;
	} = $props();

	let uploading = $state(false);
	let dragOver = $state(false);
	let editingAssetId = $state<string | null>(null);
	let editType = $state<'image' | 'spritesheet' | 'audio'>('image');
	let editFrameW = $state(32);
	let editFrameH = $state(32);

	let editingAsset = $derived(editingAssetId ? assets.find(a => a.id === editingAssetId) ?? null : null);

	async function uploadFile(file: File) {
		uploading = true;
		try {
			const key = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
			const type = file.type.startsWith('audio/') ? 'audio' : 'image';

			const formData = new FormData();
			formData.set('file', file);
			formData.set('key', key);
			formData.set('type', type);

			const res = await fetch('/api/assets', { method: 'POST', body: formData });
			if (!res.ok) throw new Error('Upload failed');
			const asset: Asset = await res.json();
			onAssetAdded(asset);
		} finally {
			uploading = false;
		}
	}

	function startEditing(asset: Asset) {
		editingAssetId = asset.id;
		editType = asset.type;
		editFrameW = asset.frameWidth ?? 32;
		editFrameH = asset.frameHeight ?? 32;
	}

	function saveAssetConfig() {
		if (!editingAsset) return;
		// Update the asset in place — remove old, add updated
		const updated: Asset = {
			...editingAsset,
			type: editType,
			frameWidth: editType === 'spritesheet' ? editFrameW : undefined,
			frameHeight: editType === 'spritesheet' ? editFrameH : undefined,
		};
		onAssetRemoved(editingAsset.id);
		onAssetAdded(updated);
		editingAssetId = null;
	}

	function cancelEditing() {
		editingAssetId = null;
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			for (const file of input.files) {
				uploadFile(file);
			}
			input.value = '';
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (e.dataTransfer?.files) {
			for (const file of e.dataTransfer.files) {
				uploadFile(file);
			}
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function getThumbUrl(asset: Asset): string {
		return `${projectBaseUrl}/${asset.filename}`;
	}
</script>

<div class="asset-panel">
	<div class="panel-header">
		Assets
		<label class="upload-btn">
			+
			<input type="file" accept="image/*,audio/*" multiple onchange={handleFileInput} hidden />
		</label>
	</div>

	<div
		class="drop-zone"
		class:drag-over={dragOver}
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		role="region"
		aria-label="Drop files to upload"
	>
		{#if uploading}
			<div class="upload-status">Uploading...</div>
		{:else if assets.length === 0}
			<div class="empty-hint">Drop images or audio here</div>
		{/if}

		<div class="asset-grid">
			{#each assets as asset (asset.id)}
				<div
					class="asset-item"
					class:editing={editingAssetId === asset.id}
					title={`${asset.key} (${asset.type})${asset.type === 'spritesheet' ? ` ${asset.frameWidth}x${asset.frameHeight}` : ''}`}
					ondblclick={() => startEditing(asset)}
				>
					{#if asset.type === 'audio'}
						<div class="asset-thumb audio-icon">&#x266B;</div>
					{:else}
						<img class="asset-thumb" src={getThumbUrl(asset)} alt={asset.key} />
					{/if}
					<div class="asset-key">{asset.key}</div>
					{#if asset.type === 'spritesheet'}
						<div class="asset-badge">SS</div>
					{/if}
					<button
						class="remove-btn"
						title="Remove asset"
						onclick={() => onAssetRemoved(asset.id)}
					>&times;</button>
				</div>
			{/each}
		</div>

		{#if editingAsset}
			<div class="asset-config">
				<div class="config-header">{editingAsset.key}</div>
				<div class="config-row">
					<label>Type</label>
					<select bind:value={editType}>
						<option value="image">Image</option>
						<option value="spritesheet">Spritesheet</option>
						{#if editingAsset.type === 'audio'}<option value="audio">Audio</option>{/if}
					</select>
				</div>
				{#if editType === 'spritesheet'}
					<div class="config-row">
						<label>Frame W</label>
						<input type="number" bind:value={editFrameW} min="1" />
					</div>
					<div class="config-row">
						<label>Frame H</label>
						<input type="number" bind:value={editFrameH} min="1" />
					</div>
				{/if}
				<div class="config-actions">
					<button onclick={saveAssetConfig}>Save</button>
					<button onclick={cancelEditing}>Cancel</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.asset-panel {
		border-top: 1px solid var(--border);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 10px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 8px;
		color: var(--text-muted);
	}

	.upload-btn {
		cursor: pointer;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 3px;
		padding: 1px 6px;
		font-size: 12px;
		color: var(--text-primary);
	}

	.upload-btn:hover {
		background: #2a2a3a;
	}

	.drop-zone {
		min-height: 60px;
		padding: 4px;
		transition: background 0.15s;
	}

	.drop-zone.drag-over {
		background: rgba(96, 165, 250, 0.1);
		outline: 2px dashed var(--accent-blue);
		outline-offset: -2px;
	}

	.empty-hint, .upload-status {
		font-size: 10px;
		color: var(--text-muted);
		text-align: center;
		padding: 12px 8px;
	}

	.asset-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
		gap: 4px;
		padding: 2px;
	}

	.asset-item {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4px;
		border-radius: 4px;
		cursor: default;
	}

	.asset-item:hover {
		background: var(--bg-tertiary);
	}

	.asset-thumb {
		width: 48px;
		height: 48px;
		object-fit: contain;
		border-radius: 3px;
		background: var(--bg-primary);
		image-rendering: pixelated;
	}

	.audio-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		color: var(--accent-purple);
	}

	.asset-key {
		font-size: 9px;
		color: var(--text-secondary);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		margin-top: 2px;
	}

	.remove-btn {
		position: absolute;
		top: 1px;
		right: 1px;
		width: 14px;
		height: 14px;
		padding: 0;
		font-size: 10px;
		line-height: 12px;
		text-align: center;
		border-radius: 50%;
		opacity: 0;
		background: var(--accent-red);
		color: white;
		border: none;
		cursor: pointer;
	}

	.asset-item:hover .remove-btn {
		opacity: 1;
	}

	.asset-item.editing {
		outline: 1px solid var(--accent-blue);
	}

	.asset-badge {
		position: absolute;
		bottom: 18px;
		left: 2px;
		font-size: 7px;
		background: var(--accent-purple);
		color: white;
		padding: 0 3px;
		border-radius: 2px;
		font-weight: bold;
	}

	.asset-config {
		padding: 6px 8px;
		border-top: 1px solid var(--border);
		background: var(--bg-tertiary);
	}

	.config-header {
		font-size: 10px;
		font-weight: bold;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.config-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 3px;
	}

	.config-row label {
		font-size: 9px;
		color: var(--text-secondary);
		width: 48px;
		flex-shrink: 0;
	}

	.config-row select,
	.config-row input {
		flex: 1;
		width: 0;
		font-size: 10px;
	}

	.config-actions {
		display: flex;
		gap: 4px;
		margin-top: 4px;
	}

	.config-actions button {
		flex: 1;
		font-size: 9px;
		padding: 2px 6px;
	}
</style>
