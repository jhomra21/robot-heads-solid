import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { cloudflare } from '@cloudflare/vite-plugin';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [solid(), cloudflare()],
  resolve: {
    alias: {
      'robot-heads-solid': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
    dedupe: ['solid-js'],
  },
});
