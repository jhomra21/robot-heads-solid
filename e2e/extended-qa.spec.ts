// Browser regression evidence is written under test-results/extended-qa.
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'test-results', 'extended-qa');

mkdirSync(out, { recursive: true });

const geometries = ['rectangle', 'square', 'circle', 'hexagon'];

const states = ['idle', 'thinking', 'searching', 'listening', 'speaking', 'working', 'happy', 'error', 'sleeping'];

const title = (value: string) => value[0].toUpperCase() + value.slice(1);

test.setTimeout(120_000);

async function pixels(page: import('@playwright/test').Page) {
  return page.locator('main.stage canvas').evaluate((element) => {
    // SAFETY: the selector addresses the canvas in main.stage.
    const canvas = element as HTMLCanvasElement;
    const data = canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, canvas.width, canvas.height).data;
    let nontransparent = 0, sum = 0, hash = 2166136261;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]) nontransparent++;
      sum += data[i] + data[i + 1] + data[i + 2] + data[i + 3];

      for (let j = 0; j < 4; j++) hash = Math.imul(hash ^ data[i + j], 16777619);
    }

    return { width: canvas.width, height: canvas.height, nontransparent, sum, hash: hash >>> 0 };
  });
}

async function snap(page: import('@playwright/test').Page, name: string) {
  const file = join(out, `${name}.png`);
  await page.locator('main.stage canvas').screenshot({ path: file });

  return file;
}

function save(name: string, serialized: string) {
  writeFileSync(join(out, `${name}.json`), serialized + '\n');
}

test('all 36 shape and state combinations paint a distinct state', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?paused&shape=rectangle&state=idle');
  const observations = [];

  for (const shape of geometries) {
    await page.getByRole('button', { name: title(shape), exact: true }).click();
    await page.locator('nav[aria-label="State"]').getByRole('button', { name: 'Idle', exact: true }).click();
    const idle = await pixels(page);

    for (const state of states) {
      await page.locator('nav[aria-label="State"]').getByRole('button', { name: title(state), exact: true }).click();
      await expect(page.getByRole('heading', { name: title(state), exact: true })).toBeVisible();
      const data = await pixels(page);
      observations.push({ shape, state, ...data, screenshot: await snap(page, `matrix-${shape}-${state}`) });
      expect(data.nontransparent, `${shape}/${state} blank`).toBeGreaterThan(100);

      if (state !== 'idle') expect(data.hash, `${shape}/${state} did not update from idle`).not.toBe(idle.hash);
    }
  }

  save('matrix', JSON.stringify({ observations, errors }, null, 2));
  expect(errors).toEqual([]);
});

test('appearance, pause, animation, speed, pointer, and click actually update pixels', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?paused&state=speaking');
  const data: Record<string, { hash: number } | { start: { hash: number }; end: { hash: number } }> = {};
  const original = await pixels(page);
  data.original = original;
  await snap(page, 'appearance-before');

  for (const [label, selector] of [
    ['shell', 'Shell: Tomato'], ['trim', 'Trim: Brass'], ['screen', 'Screen: Matrix'],
  ]) {
    await page.getByRole('button', { name: selector }).click();
    const sample = await pixels(page);
    data[label] = sample;
    await snap(page, `appearance-${label}`);
    expect(sample.hash).not.toBe(original.hash);
  }

  const p0 = await pixels(page);
  await page.waitForTimeout(550);
  const p1 = await pixels(page);
  data.paused = { start: p0, end: p1 };
  expect(p0.hash, 'paused canvas changed').toBe(p1.hash);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.locator('main.stage canvas').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const playing0 = await pixels(page);
  await page.waitForTimeout(450);
  const playing1 = await pixels(page);
  data.playing = { start: playing0, end: playing1 };
  expect(playing0.hash, 'speaking animation did not change').not.toBe(playing1.hash);
  await snap(page, 'playing');

  await page.getByRole('button', { name: '0.5×' }).click();
  await expect(page.getByRole('button', { name: '0.5×' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('main.stage canvas').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const slow = await pixels(page);
  await page.getByRole('button', { name: '2×' }).click();
  await expect(page.getByRole('button', { name: '2×' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('main.stage canvas').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const fast = await pixels(page);
  data.speed = { slow, fast };
  expect(slow.hash, 'speed changes did not redraw').not.toBe(fast.hash);
  await snap(page, 'speed-fast');

  // Move pointer on the stage, then click its canvas; preserve independent samples.
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.locator('nav[aria-label="State"]').getByRole('button', { name: 'Idle', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const canvas = page.locator('main.stage canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x - 100, box.y + box.height / 2);
  await page.waitForTimeout(200);
  const pointerLeft = await pixels(page);
  await page.mouse.move(box.x + box.width + 100, box.y + box.height / 2);
  await page.waitForTimeout(200);
  const pointerRight = await pixels(page);
  data.pointer = { left: pointerLeft, right: pointerRight };
  expect(pointerLeft.hash, 'pointer did not change canvas').not.toBe(pointerRight.hash);
  await snap(page, 'pointer-right');
  const beforeClick = await pixels(page);
  await canvas.click();
  await page.waitForTimeout(130);
  const afterClick = await pixels(page);
  data.click = { before: beforeClick, after: afterClick };
  expect(beforeClick.hash, 'click did not change canvas').not.toBe(afterClick.hash);
  await snap(page, 'click-after');
  save('interactions', JSON.stringify({ data, errors }, null, 2));
  expect(errors).toEqual([]);
});

test('reduced motion stays still while changing state and theme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?state=happy');
  const initial = await pixels(page);
  await page.waitForTimeout(650);
  const after = await pixels(page);
  expect(initial.hash).toBe(after.hash);
  await snap(page, 'reduced-motion-before');
  await page.locator('nav[aria-label="State"]').getByRole('button', { name: 'Error', exact: true }).click();
  const changed = await pixels(page);
  expect(changed.hash).not.toBe(initial.hash);
  await page.waitForTimeout(400);
  expect((await pixels(page)).hash).toBe(changed.hash);
  const themeBefore = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /Switch to (light|dark) mode/ }).click();
  const themeAfter = await page.locator('html').getAttribute('data-theme');
  expect(themeBefore).not.toBe(themeAfter);
  await page.screenshot({ path: join(out, 'reduced-motion-theme.png'), fullPage: true });
  save('reduced-motion-theme', JSON.stringify({ initial, after, changed, themeBefore, themeAfter }, null, 2));
});

test('mobile viewport overflow and browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const viewports = [];

  for (const width of [320, 375, 390, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/?shape=hexagon&state=working');
    await page.waitForTimeout(150);

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overflowing: [...document.querySelectorAll('*')].flatMap(el => {
        const right = Math.round(el.getBoundingClientRect().right);

        return right > window.innerWidth + 2
          ? [{ tag: el.tagName, className: el.getAttribute('class') ?? '', right }]
          : [];
      }).slice(0, 12),
    }));

    viewports.push({ width, ...metrics, screenshot: join(out, `mobile-${width}.png`) });
    await page.screenshot({ path: join(out, `mobile-${width}.png`), fullPage: true });
  }

  save('mobile', JSON.stringify({ viewports, errors }, null, 2));
  expect(errors).toEqual([]);

  for (const result of viewports) expect(result.scrollWidth, `${result.width}px horizontal overflow`).toBeLessThanOrEqual(result.innerWidth);
});
