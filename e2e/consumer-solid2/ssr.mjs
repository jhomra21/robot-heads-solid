import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const vite = await createServer({ configFile: new URL('./vite.ssr.config.ts', import.meta.url).pathname, server: { middlewareMode: true } });

try {
  const { verifySSR } = await vite.ssrLoadModule('/src/ssr-check.tsx');
  const result = verifySSR();
  console.log(JSON.stringify({ renderedCanvas: result.renderedCanvas, accessibleName: result.accessibleName }));
  const output = resolve(import.meta.dirname, '../../test-results/consumer-solid2-hydration.json');
  mkdirSync(resolve(import.meta.dirname, '../../test-results'), { recursive: true });
  writeFileSync(output, JSON.stringify({ html: result.hydrationHtml, script: result.hydrationScript }));
} finally {
  await vite.close();
}
