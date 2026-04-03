import type { ObjTypeMeta } from './types.js';

export const OBJ_TYPES: Record<string, ObjTypeMeta> = {
	sprite:    { label: 'Sprite',    color: '#4a7dff', icon: '◆' },
	text:      { label: 'Text',      color: '#34d399', icon: 'T' },
	rectangle: { label: 'Rectangle', color: '#f59e0b', icon: '▬' },
	circle:    { label: 'Circle',    color: '#a78bfa', icon: '●' },
	image:     { label: 'Image',     color: '#22d3ee', icon: '▣' },
	tilemap:   { label: 'Tilemap',   color: '#f472b6', icon: '▦' },
	group:     { label: 'Group',     color: '#fb923c', icon: '◈' },
	particles: { label: 'Particles', color: '#e879f9', icon: '✦' },
	zone:      { label: 'Zone',      color: '#94a3b8', icon: '⬚' },
};

export const DEFAULT_CONFIG = {
	width: 800,
	height: 600,
	physics: 'arcade',
	pixelArt: false,
	backgroundColor: '#1a1a2e',
} as const;
