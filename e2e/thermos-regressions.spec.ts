import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'test-results', 'thermos');

mkdirSync(out, { recursive: true });

test('state and pause URLs survive reload and browser navigation; copied JSX includes pause', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText(value: string) {
        localStorage.setItem('copied-jsx', value);

        return Promise.resolve();
      } },
    });
  });
  await page.goto('/?source=thermos&shape=circle&state=idle');
  await page.getByRole('button', { name: 'Error', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(new URL(page.url()).searchParams.get('source')).toBe('thermos');
  expect(new URL(page.url()).searchParams.get('state')).toBe('error');
  expect(new URL(page.url()).searchParams.has('paused')).toBe(true);
  await expect(page.locator('aside .code')).toContainText('paused={true}');
  await page.getByRole('button', { name: 'Copy', exact: true }).last().click();
  expect(await page.evaluate(() => localStorage.getItem('copied-jsx'))).toContain('paused={true}');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.getByRole('button', { name: 'Play' }).click();
  expect(new URL(page.url()).searchParams.has('paused')).toBe(false);
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  writeFileSync(join(out, 'url.json'), JSON.stringify({ url: page.url() }, null, 2));
});

test('short desktop controls never cover state choices', async ({ page }) => {
  const results = [];

  for (const height of [660, 700, 768]) {
    await page.setViewportSize({ width: 1280, height });
    await page.goto('/?state=error');
    const controls = await page.locator('.controls').boundingBox();
    const states = await page.locator('.states').boundingBox();
    expect(controls).not.toBeNull();
    expect(states).not.toBeNull();
    results.push({ height, controls, states });
    expect(controls!.y + controls!.height).toBeLessThanOrEqual(states!.y + 1);
    await page.getByRole('button', { name: 'Sleeping', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Sleeping' })).toBeVisible();
    await page.screenshot({ path: join(out, `desktop-${height}.png`) });
  }

  writeFileSync(join(out, 'layout.json'), JSON.stringify(results, null, 2));
});

test('offscreen previews stop receiving frames and resume when visible', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    let draws = 0;

    // SAFETY: the wrapper forwards precisely the original canvas context arguments and return value.
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (this.closest('nav.states') && args[0] === '2d') draws++;

      return original.apply(this, args);
    } as typeof original;

    Object.defineProperty(window, '__stateDraws', { get: () => draws });
  });
  await page.setViewportSize({ width: 375, height: 680 });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  // SAFETY: addInitScript defines this getter before navigation.
  const before = await page.evaluate(() => (window as Window & { __stateDraws: number }).__stateDraws);
  await page.waitForTimeout(350);
  // SAFETY: addInitScript defines this getter before navigation.
  const hidden = await page.evaluate(() => (window as Window & { __stateDraws: number }).__stateDraws);
  expect(hidden - before).toBe(0);
  await page.locator('.states').scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  // SAFETY: addInitScript defines this getter before navigation.
  const visible = await page.evaluate(() => (window as Window & { __stateDraws: number }).__stateDraws);
  expect(visible).toBeGreaterThan(hidden);
  writeFileSync(join(out, 'visibility.json'), JSON.stringify({ before, hidden, visible }, null, 2));
  await page.screenshot({ path: join(out, 'mobile-states.png') });
});

test('nonfinite and extreme numerical values do not hang the simulation', async ({ page }) => {
  await page.goto('/');
  const path = new URL('../src/tv/sim.ts', import.meta.url).pathname;

  const values = await page.evaluate(async (url) => {
    const { RobotSim } = await import(url);
    const sim = new RobotSim(0.5, 'idle');

    for (const dt of [Infinity, NaN, -0, -1, 10000]) sim.update(dt);

    return { age: sim.age, yaw: sim.pose.yaw };
  }, `/@fs${path}`);

  expect(Number.isFinite(values.age)).toBe(true);
  expect(Number.isFinite(values.yaw)).toBe(true);
  expect(values.age).toBeLessThan(10);
  writeFileSync(join(out, 'numeric.json'), JSON.stringify(values, null, 2));
});

test('simulation preserves elapsed time at supported playback speeds', async ({ page }) => {
  await page.goto('/');
  const path = new URL('../src/tv/sim.ts', import.meta.url).pathname;

  const ages = await page.evaluate(async (url) => {
    const { RobotSim } = await import(url);
    const fast = new RobotSim(0.5, 'idle');
    const normal = new RobotSim(0.5, 'idle');

    for (let i = 0; i < 60; i++) fast.update(8 / 60);

    for (let i = 0; i < 30; i++) normal.update(4 / 30);

    return { fast: fast.age, normal: normal.age };
  }, `/@fs${path}`);

  expect(ages.fast).toBeCloseTo(8, 4);
  expect(ages.normal).toBeCloseTo(4, 4);
  writeFileSync(join(out, 'time.json'), JSON.stringify(ages, null, 2));
});

test('many viewport resizes keep shared canvas textures bounded', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1350, height: 660 });
  await page.goto('/?paused');

  for (let height = 660; height <= 800; height += 7) {
    await page.setViewportSize({ width: 1350, height });
    await expect(page.locator('main.stage canvas')).toHaveJSProperty('width', height - 300);
  }

  const path = new URL('../src/tv/render.ts', import.meta.url).pathname;

  const stats = await page.evaluate(async (url) => {
    const { bakeCacheStats } = await import(url);

    return bakeCacheStats();
  }, `/@fs${path}`);

  expect(stats.entries).toBeGreaterThan(2);
  expect(stats.entries).toBeLessThanOrEqual(12);
  expect(stats.bytes).toBeLessThanOrEqual(24 * 1024 * 1024);
  writeFileSync(join(out, 'cache.json'), JSON.stringify(stats, null, 2));
});
