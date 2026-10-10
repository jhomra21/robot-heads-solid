import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';

export default defineConfig({
  plugins: [solid({ solid: { generate: 'ssr', hydratable: true } })],
  resolve: { dedupe: ['solid-js', '@solidjs/web'] },
});
