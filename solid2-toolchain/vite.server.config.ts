import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [solid({ solid: { generate: 'ssr', hydratable: true } })],
  build: {
    outDir: resolve(import.meta.dirname, '../dist'),
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, '../src/solid2/index.ts'),
      formats: ['es'],
      fileName: () => 'solid2.server.js',
    },
    rollupOptions: { external: ['solid-js', '@solidjs/web'] },
  },
});
