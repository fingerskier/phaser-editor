// src/lib/phaser/bridge.ts
import Phaser from 'phaser';
import type { GameObject, Asset } from '$lib/types.js';

export function createPhaserBridge(container: HTMLElement, config: {
	width: number; height: number; backgroundColor: string; physics: string; pixelArt: boolean;
}) {
	let game: Phaser.Game | null = null;
	const loadedTextures = new Set<string>();

	function start() {
		if (game) game.destroy(true);
		loadedTextures.clear();
		game = new Phaser.Game({
			type: Phaser.AUTO,
			parent: container,
			width: config.width,
			height: config.height,
			backgroundColor: config.backgroundColor,
			pixelArt: config.pixelArt,
			physics: {
				default: config.physics,
				arcade: { gravity: { x: 0, y: 300 }, debug: false },
			},
			scene: { create() {} },
		});
	}

	function loadAssets(assets: Asset[], baseUrl = '/api/assets') {
		if (!game || !game.scene.scenes[0]) return;
		const scene = game.scene.scenes[0];
		let needsLoad = false;

		for (const asset of assets) {
			if (loadedTextures.has(asset.key)) continue;
			if (asset.type === 'audio') continue;
			const url = `${baseUrl}/${asset.filename}`;
			if (asset.type === 'spritesheet' && asset.frameWidth && asset.frameHeight) {
				scene.load.spritesheet(asset.key, url, {
					frameWidth: asset.frameWidth,
					frameHeight: asset.frameHeight,
				});
			} else {
				scene.load.image(asset.key, url);
			}
			loadedTextures.add(asset.key);
			needsLoad = true;
		}

		if (needsLoad) {
			scene.load.start();
		}
	}

	function syncObjects(objects: GameObject[]) {
		if (!game || !game.scene.scenes[0]) return;
		const scene = game.scene.scenes[0];
		scene.children.removeAll(true);
		for (const obj of objects) {
			if (!obj.visible) continue;
			const color = parseInt(obj.color.replace('#', ''), 16);
			const assetKey = String(obj.props.assetKey ?? '');
			switch (obj.objType) {
				case 'sprite':
				case 'image':
					if (assetKey && scene.textures.exists(assetKey)) {
						const img = scene.add.image(obj.x, obj.y, assetKey);
						img.setDisplaySize(obj.w, obj.h);
					} else {
						// Placeholder with label
						scene.add.rectangle(obj.x, obj.y, obj.w, obj.h, color, 0.5);
						scene.add.text(obj.x - obj.w / 2 + 4, obj.y - 6, assetKey || obj.name, {
							fontSize: '10px', color: '#fff',
						});
					}
					break;
				case 'rectangle': scene.add.rectangle(obj.x, obj.y, obj.w, obj.h, color); break;
				case 'circle': scene.add.circle(obj.x, obj.y, obj.w / 2, color); break;
				case 'text': scene.add.text(obj.x, obj.y, String(obj.props.text ?? obj.name), { fontSize: String(obj.props.fontSize ?? '16px'), color: obj.color }); break;
				default: scene.add.rectangle(obj.x, obj.y, obj.w, obj.h, color); break;
			}
		}
	}

	function getCanvas(): HTMLCanvasElement | null { return container.querySelector('canvas'); }
	function destroy() { if (game) { game.destroy(true); game = null; } loadedTextures.clear(); }
	function restart() { destroy(); start(); }

	return { start, syncObjects, loadAssets, getCanvas, destroy, restart };
}

export type PhaserBridge = ReturnType<typeof createPhaserBridge>;
