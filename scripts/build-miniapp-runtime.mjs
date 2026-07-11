import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

const packageRoot = '.';
const demoPackageRoot = 'examples/miniprogram/miniprogram_npm/mp-components-to-canvas-or-image';

await build({
  entryPoints: ['src/miniapp-runtime/package-entry.ts'],
  outfile: 'runtime/share-card-runtime.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2020'],
  sourcemap: false,
  legalComments: 'none',
});

await rm(demoPackageRoot, { recursive: true, force: true });
await mkdir(demoPackageRoot, { recursive: true });

for (const name of ['api', 'components', 'runtime', 'README.md', 'package.json']) {
  await cp(`${packageRoot}/${name}`, `${demoPackageRoot}/${name}`, { recursive: true });
}
