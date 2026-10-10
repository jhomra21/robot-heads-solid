import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

test('consumer package installs the stable manifest from a versioned tarball', () => {
  const manifest = JSON.parse(readFileSync('e2e/consumer/node_modules/robot-heads-solid/package.json', 'utf8'));
  expect(manifest.version).toBe('0.1.0');
  expect(manifest.publishConfig).toEqual({ access: 'public', tag: 'latest' });
});

test('packed tarball loads and reacts in an external Solid 1 application', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:4175/');
  const canvas = page.locator('canvas[data-consumer="true"]');
  await expect(canvas).toHaveAttribute('aria-label', 'consumer idle');
  await expect(page.locator('#ref')).toHaveText('CANVAS');
  const before = await canvas.screenshot();
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(canvas).toHaveAttribute('aria-label', 'consumer error');
  const after = await canvas.screenshot();
  expect(before.equals(after)).toBe(false);
  await page.getByRole('button', { name: 'Toggle pause' }).click();
  await page.waitForTimeout(120);
  await page.getByRole('button', { name: 'Invalid dimensions and speed' }).click();
  await page.waitForTimeout(120);
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveCSS('width', '160px');
  const pixels = Math.round(160 * Math.min(2, await page.evaluate(() => window.devicePixelRatio || 1)));
  await expect(canvas).toHaveJSProperty('width', pixels);
  await expect(canvas).toHaveJSProperty('height', pixels);
  mkdirSync('test-results', { recursive: true });
  await canvas.screenshot({ path: 'test-results/consumer-solid1-after.png' });
  writeFileSync('test-results/consumer-solid1-browser.json',
    JSON.stringify({ errors, beforeBytes: before.length, afterBytes: after.length, changed: !before.equals(after) }, null, 2));
  expect(errors).toEqual([]);
});

test('packed SSR canvas survives hydration and replays a click queued before hydration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/hydration.html');
  const canvas = page.locator('[data-hydration="canvas"]');
  await expect(canvas).toHaveAttribute('aria-label', 'Robot, idle');
  await page.waitForFunction(() => Reflect.has(window, 'startHydration'));
  await page.evaluate(() => {
    Reflect.set(window, 'serverCanvas', document.querySelector('[data-hydration="canvas"]'));
  });
  await canvas.click();
  await expect(page.locator('#queued-clicks')).toHaveText('0');

  // SAFETY: generateHydrationScript installs _$HY with an events array before hydration.
  const queuedBefore = await page.evaluate(() => (window as Window & { _$HY: { events: unknown[] } })._$HY.events.length);
  expect(queuedBefore).toBe(1);

  // SAFETY: waitForFunction confirmed the hydration gate was installed by hydrate.tsx.
  await page.evaluate(() => (window as Window & { startHydration: () => void }).startHydration());
  await expect(page.locator('#queued-clicks')).toHaveText('1');

  // SAFETY: the test stored the SSR canvas as serverCanvas before hydration.
  const reused = await page.evaluate(() =>
    (window as Window & { serverCanvas: HTMLCanvasElement }).serverCanvas ===
    document.querySelector('[data-hydration="canvas"]'));

  expect(reused).toBe(true);
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/consumer-hydration.json', JSON.stringify({ reused, queuedBefore, after: 1, errors }, null, 2));
  expect(errors).toEqual([]);
});
