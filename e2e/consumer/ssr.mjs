import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { renderToString, generateHydrationScript } from 'solid-js/web';
import { createComponent } from 'solid-js';
import { RobotHead, robotHeadShapes, robotHeadStates } from 'robot-heads-solid';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);

const cjs = require('robot-heads-solid');

const cjsSolid = require('solid-js');

const cjsWeb = require('solid-js/web');

if (robotHeadShapes.length !== 4 || robotHeadStates.length !== 9) throw new Error('Missing public inventory');

if (cjs.robotHeadShapes.length !== 4 || cjs.robotHeadStates.length !== 9) throw new Error('CJS inventory missing');

const esmHTML = renderToString(() => createComponent(RobotHead, { state: 'error', size: 128, paused: true }));

const cjsHTML = cjsWeb.renderToString(() => cjsSolid.createComponent(cjs.RobotHead, { state: 'sleeping', size: 128, paused: true }));

if (!esmHTML.includes('aria-label="Robot, error"') || !cjsHTML.includes('aria-label="Robot, sleeping"')) {
  throw new Error(`SSR rendered wrong canvas: ${esmHTML} ${cjsHTML}`);
}

writeFileSync('../../test-results/consumer-ssr.json', JSON.stringify({ esmHTML, cjsHTML }, null, 2) + '\n');

const resolveExport = (conditions, moduleType) => execFileSync(process.execPath, [
  ...conditions, ...moduleType,
], { cwd: process.cwd(), encoding: 'utf8' }).trim();

const esm = "console.log(import.meta.resolve('robot-heads-solid'))";

const commonjs = "console.log(require.resolve('robot-heads-solid'))";

const exports = {
  serverImport: resolveExport([], ['--input-type=module', '-e', esm]),
  serverRequire: resolveExport([], ['-e', commonjs]),
  browserImport: resolveExport(['--conditions=browser'], ['--input-type=module', '-e', esm]),
  browserRequire: resolveExport(['--conditions=browser'], ['-e', commonjs]),
};

writeFileSync('../../test-results/consumer-exports.json', JSON.stringify(exports, null, 2) + '\n');

const vite = await createServer({ configFile: 'vite.config.ts', server: { middlewareMode: true } });

try {
  const { HydrationApp } = await vite.ssrLoadModule('/src/Hydration.tsx');
  const markup = renderToString(() => createComponent(HydrationApp, {}));

  if (!markup.includes('data-hydration="canvas"')) throw new Error(`Missing SSR canvas: ${markup}`);
  // Solid 1.9's replay uses composedPath() after dispatch, when browsers return [].
  // Preserve the original path during capture for the consumer's pre-hydration clicks.
  const preserveEventPath = `<script>document.addEventListener('click',event=>{const path=event.composedPath();Object.defineProperty(event,'composedPath',{value:()=>path})},{capture:true})</script>`;
  writeFileSync('hydration.html', `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${preserveEventPath}${generateHydrationScript()}</head><body><div id="root">${markup}</div><script type="module" src="/src/hydrate.tsx"></script></body></html>\n`);
} finally {
  await vite.close();
}

for (const [key, path] of Object.entries(exports)) {
  const browser = key.startsWith('browser');
  const format = key.endsWith('Import') ? '.js' : '.cjs';
  const expected = `index${browser ? '' : '.server'}${format}`;

  if (!path.endsWith(expected)) throw new Error(`${key} resolved ${path}, expected ${expected}`);
}
