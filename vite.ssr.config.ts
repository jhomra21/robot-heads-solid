import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [solid({ solid: { generate: 'ssr', hydratable: true } })],
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.server.js' : 'index.server.cjs',
    },
    rollupOptions: {
      external: ['solid-js', 'solid-js/web', '@solidjs/web'],
    },
  },
});
