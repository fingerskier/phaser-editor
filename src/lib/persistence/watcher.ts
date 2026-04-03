import { watch } from 'node:fs';
import { join } from 'node:path';

export function watchProject(dir: string, onChange: (filename: string) => void): () => void {
	const watchers = [
		watch(join(dir, 'scenes'), { recursive: false }, (_event, filename) => {
			if (filename) onChange(`scenes/${filename}`);
		}),
		watch(join(dir, 'modules'), { recursive: false }, (_event, filename) => {
			if (filename) onChange(`modules/${filename}`);
		}),
		watch(dir, { recursive: false }, (_event, filename) => {
			if (filename === 'project.json') onChange(filename);
		}),
	];

	return () => watchers.forEach((w) => w.close());
}
