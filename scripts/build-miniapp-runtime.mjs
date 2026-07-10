import { mkdir, copyFile } from 'node:fs/promises';
import { build } from 'esbuild';

await build({
  entryPoints: ['src/miniapp-runtime/plugin-entry.ts'],
  outfile: 'miniprogram-plugin/runtime/share-card-runtime.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2020'],
  sourcemap: false,
  legalComments: 'none',
});

await mkdir('miniprogram-demo/runtime', { recursive: true });
await copyFile('miniprogram-plugin/runtime/share-card-runtime.js', 'miniprogram-demo/runtime/share-card-runtime.js');
