// src/lib/phaser/transpile.ts
import { transform } from 'esbuild';

export async function transpileTS(code: string): Promise<string> {
	const result = await transform(code, { loader: 'ts', target: 'es2020' });
	return result.code;
}
