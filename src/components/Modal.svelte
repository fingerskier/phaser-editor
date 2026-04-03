<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = false,
		title = '',
		onConfirm,
		onCancel,
		children,
	}: {
		open: boolean;
		title: string;
		onConfirm: () => void;
		onCancel: () => void;
		children?: Snippet;
	} = $props();

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onCancel();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onCancel();
		if (e.key === 'Enter') onConfirm();
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="overlay" onclick={handleOverlayClick}>
		<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<div class="modal-header">
				<span id="modal-title" class="modal-title">{title}</span>
			</div>
			<div class="modal-body">
				{#if children}
					{@render children()}
				{/if}
			</div>
			<div class="modal-footer">
				<button onclick={onCancel}>Cancel</button>
				<button class="confirm-btn" onclick={onConfirm}>Confirm</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		min-width: 320px;
		max-width: 520px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		padding: 12px 16px;
		border-bottom: 1px solid var(--border);
	}

	.modal-title {
		font-size: 13px;
		font-weight: bold;
		color: var(--text-primary);
	}

	.modal-body {
		padding: 16px;
		font-size: 12px;
		color: var(--text-secondary);
		flex: 1;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px 16px;
		border-top: 1px solid var(--border);
	}

	.confirm-btn {
		background: var(--accent-green);
		color: #000;
		border-color: var(--accent-green);
		font-weight: bold;
	}

	.confirm-btn:hover {
		background: #2bb584;
		border-color: #2bb584;
	}
</style>
