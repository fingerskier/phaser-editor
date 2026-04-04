<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Phaser from 'phaser';
	import type { Project, Asset, Scene as EditorScene } from '$lib/types.js';

	let { project }: { project: Project } = $props();

	let container: HTMLDivElement;
	let game: Phaser.Game | null = null;
	let error = $state<string | null>(null);

	async function transpileCode(code: string): Promise<string> {
		const res = await fetch('/api/transpile', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code }),
		});
		if (!res.ok) throw new Error('Transpilation failed');
		const { js } = await res.json();
		return js;
	}

	function createPreloadScene(assets: Asset[]): typeof Phaser.Scene {
		return class PreloadScene extends Phaser.Scene {
			constructor() {
				super({ key: '__preload__' });
			}
			preload() {
				for (const asset of assets) {
					const url = `/api/assets/${asset.filename}`;
					if (asset.type === 'spritesheet' && asset.frameWidth && asset.frameHeight) {
						this.load.spritesheet(asset.key, url, {
							frameWidth: asset.frameWidth,
							frameHeight: asset.frameHeight,
						});
					} else if (asset.type === 'audio') {
						this.load.audio(asset.key, url);
					} else {
						this.load.image(asset.key, url);
					}
				}
			}
			create() {
				// Start first user scene
				const firstScene = assets.length > 0 ? undefined : undefined;
				const scenes = this.scene.manager.getScenes(false);
				const userScene = scenes.find(s => s.scene.key !== '__preload__');
				if (userScene) {
					this.scene.start(userScene.scene.key);
				}
			}
		};
	}

	async function buildSceneClass(editorScene: EditorScene): Promise<typeof Phaser.Scene | null> {
		let code = editorScene.code.trim();
		if (!code) {
			// Generate a basic scene from objects
			code = generateBasicScene(editorScene);
		}

		try {
			const js = await transpileCode(code);
			// Wrap in a module that returns the class
			const wrappedJs = `
				${js}
				return ${editorScene.name};
			`;
			const SceneClass = new Function('Phaser', wrappedJs)(Phaser);
			return SceneClass;
		} catch (e) {
			console.warn(`Failed to transpile scene ${editorScene.name}:`, e);
			return null;
		}
	}

	function generateBasicScene(scene: EditorScene): string {
		const creates: string[] = [];
		for (const obj of scene.objects) {
			if (!obj.visible) continue;
			const colorNum = `0x${obj.color.replace('#', '')}`;
			const assetKey = obj.props.assetKey as string | undefined;
			switch (obj.objType) {
				case 'sprite':
				case 'image':
					if (assetKey) {
						creates.push(`    this.add.image(${obj.x}, ${obj.y}, '${assetKey}').setDisplaySize(${obj.w}, ${obj.h});`);
					} else {
						creates.push(`    this.add.rectangle(${obj.x}, ${obj.y}, ${obj.w}, ${obj.h}, ${colorNum});`);
					}
					break;
				case 'rectangle':
					creates.push(`    this.add.rectangle(${obj.x}, ${obj.y}, ${obj.w}, ${obj.h}, ${colorNum});`);
					break;
				case 'circle':
					creates.push(`    this.add.circle(${obj.x}, ${obj.y}, ${obj.w / 2}, ${colorNum});`);
					break;
				case 'text':
					creates.push(`    this.add.text(${obj.x}, ${obj.y}, '${String(obj.props.text ?? obj.name).replace(/'/g, "\\'")}', { fontSize: '${obj.props.fontSize ?? '16px'}', color: '${obj.color}' });`);
					break;
				default:
					creates.push(`    this.add.rectangle(${obj.x}, ${obj.y}, ${obj.w}, ${obj.h}, ${colorNum});`);
					break;
			}
		}

		return `class ${scene.name} extends Phaser.Scene {
  constructor() { super({ key: '${scene.name}' }); }
  create() {
${creates.join('\n')}
  }
  update() {}
}`;
	}

	async function startGame() {
		error = null;
		if (game) { game.destroy(true); game = null; }

		try {
			const sceneClasses: (typeof Phaser.Scene)[] = [];

			// Add preload scene if we have assets
			if (project.assets.length > 0) {
				sceneClasses.push(createPreloadScene(project.assets));
			}

			// Build user scene classes
			for (const scene of project.scenes) {
				const SceneClass = await buildSceneClass(scene);
				if (SceneClass) sceneClasses.push(SceneClass);
			}

			if (sceneClasses.length === 0) {
				error = 'No valid scenes to run';
				return;
			}

			game = new Phaser.Game({
				type: Phaser.AUTO,
				parent: container,
				width: project.config.width,
				height: project.config.height,
				backgroundColor: project.config.backgroundColor,
				pixelArt: project.config.pixelArt,
				physics: {
					default: project.config.physics,
					arcade: { gravity: { x: 0, y: 300 }, debug: false },
				},
				scene: sceneClasses,
				input: { keyboard: true, mouse: true, touch: true },
			});
		} catch (e) {
			error = `Failed to start game: ${e instanceof Error ? e.message : String(e)}`;
		}
	}

	onMount(() => { startGame(); });
	onDestroy(() => { if (game) { game.destroy(true); game = null; } });
</script>

<div style="position:relative;flex:1;display:flex;align-items:center;justify-content:center;background:#000;">
	{#if error}
		<div class="play-error">
			<div class="error-icon">!</div>
			<div>{error}</div>
		</div>
	{/if}
	<div bind:this={container} style="position:relative;"></div>
</div>

<style>
	.play-error {
		position: absolute;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(239, 68, 68, 0.9);
		color: white;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 12px;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: 80%;
	}

	.error-icon {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		color: #ef4444;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 14px;
		flex-shrink: 0;
	}
</style>
