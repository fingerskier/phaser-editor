<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { javascript } from '@codemirror/lang-javascript';
	import { EditorState } from '@codemirror/state';
	import { oneDark } from '@codemirror/theme-one-dark';

	let { code = '', onCodeChange }: { code: string; onCodeChange: (newCode: string) => void; } = $props();

	let container: HTMLDivElement;
	let view: EditorView | null = null;

	onMount(() => {
		const state = EditorState.create({
			doc: code,
			extensions: [
				basicSetup,
				javascript({ typescript: true }),
				oneDark,
				EditorView.updateListener.of((update) => {
					if (update.docChanged) onCodeChange(update.state.doc.toString());
				}),
			],
		});
		view = new EditorView({ state, parent: container });
	});

	onDestroy(() => { view?.destroy(); });

	$effect(() => {
		if (view && code !== view.state.doc.toString()) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
		}
	});
</script>

<div bind:this={container} style="height:100%;overflow:auto;"></div>
