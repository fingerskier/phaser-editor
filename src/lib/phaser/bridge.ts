// src/lib/phaser/bridge.ts
import Phaser from 'phaser';
import type { GameObject } from '$lib/types.js';

export function createPhaserBridge(container: HTMLElement, config: {
	width: number; height: number; backgroundColor: string; physics: string; pixelArt: boolean;
}) {
	let game: Phaser.Game | null = null;

	function start() {
		if (game) game.destroy(true);
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

	function syncObjects(objects: GameObject[]) {
		if (!game || !game.scene.scenes[0]) return;
		const scene = game.scene.scenes[0];
		scene.children.removeAll(true);
		for (const obj of objects) {
			if (!obj.visible) continue;
			const color = parseInt(obj.color.replace('#', ''), 16);
			switch (obj.objType) {
				case 'rectangle': scene.add.rectangle(obj.x, obj.y, obj.w, obj.h, color); break;
				case 'circle': scene.add.circle(obj.x, obj.y, obj.w / 2, color); break;
				case 'text': scene.add.text(obj.x, obj.y, String(obj.props.text ?? obj.name), { fontSize: String(obj.props.fontSize ?? '16px'), color: obj.color }); break;
				default: scene.add.rectangle(obj.x, obj.y, obj.w, obj.h, color); break;
			}
		}
	}

	function getCanvas(): HTMLCanvasElement | null { return container.querySelector('canvas'); }
	function destroy() { if (game) { game.destroy(true); game = null; } }
	function restart() { destroy(); start(); }

	return { start, syncObjects, getCanvas, destroy, restart };
}

export type PhaserBridge = ReturnType<typeof createPhaserBridge>;
