import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';
import { resolve } from 'node:path';

const source = resolve(import.meta.dirname, '../src/solid2/index.ts');

export default defineConfig({
  plugins: [solid({ solid: { hydratable: true } })],
  build: {
    outDir: resolve(import.meta.dirname, '../dist'),
    lib: { entry: source, formats: ['es'], fileName: () => 'solid2.js' },
    rollupOptions: { external: ['solid-js', '@solidjs/web'] },
  },
});
