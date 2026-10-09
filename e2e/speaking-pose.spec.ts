import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

test('speaking still pose matches the React default across four paused shapes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?paused&state=speaking&shape=rectangle');
  await expect(page.getByRole('heading', { name: 'Speaking' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();

  const simPath = new URL('../src/tv/sim.ts', import.meta.url).pathname;

  const { still, animated } = await page.evaluate(async (url) => {
    const { restPose, RobotSim } = await import(url);
    const sim = new RobotSim(0.5, 'speaking');

    for (let frame = 0; frame < 120; frame++) sim.update(1 / 60);

    return { still: restPose('speaking'), animated: sim.pose };
  }, `/@fs${simPath}`);

  expect(still).toEqual({
    yaw: -0.18, pitch: 0.04, roll: 0.03,
    x: 0, lift: 0, sx: 1, sy: 1, antennaX: 0, antennaZ: 0,
  });
  expect(animated.yaw).not.toBe(still.yaw);
  expect(animated.pitch).not.toBe(still.pitch);

  const observations = [];

  const baseline = {
    rectangle: 1076653444,
    square: 1199569637,
    circle: 816027825,
    hexagon: 546028809,
  };

  for (const shape of ['rectangle', 'square', 'circle', 'hexagon']) {
    await page.getByRole('button', { name: shape[0].toUpperCase() + shape.slice(1), exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`shape=${shape}`));
    const canvas = page.locator('main.stage canvas');

    const sample = await canvas.evaluate((element) => {
      // SAFETY: the stage canvas locator resolves only a canvas element.
      const surface = element as HTMLCanvasElement;

      const pixels = surface.getContext('2d', { willReadFrequently: true })!
        .getImageData(0, 0, surface.width, surface.height).data;

      let visible = 0, hash = 2166136261;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3]) visible++;

        for (let j = 0; j < 4; j++) hash = Math.imul(hash ^ pixels[i + j], 16777619);
      }

      return { visible, hash: hash >>> 0 };
    });

    expect(sample.visible, `${shape} speaking canvas is blank`).toBeGreaterThan(100);
    // SAFETY: every iterated shape is a key in the baseline object above.
    expect(sample.hash, `${shape} speaking canvas changed from paused baseline`).toBe(baseline[shape as keyof typeof baseline]);
    await page.waitForTimeout(120);

    const unchanged = await canvas.evaluate((element) => {
      // SAFETY: the stage canvas locator resolves only a canvas element.
      const surface = element as HTMLCanvasElement;

      const pixels = surface.getContext('2d', { willReadFrequently: true })!
        .getImageData(0, 0, surface.width, surface.height).data;

      let hash = 2166136261;

      for (const byte of pixels) hash = Math.imul(hash ^ byte, 16777619);

      return hash >>> 0;
    });

    expect(unchanged, `${shape} paused speaking canvas moved`).toBe(sample.hash);
    await canvas.screenshot({ path: join('test-results', `speaking-pose-${shape}.png`) });
    observations.push({ shape, ...sample });
  }

  expect(new Set(observations.map(sample => sample.hash)).size).toBe(4);
  const out = join(process.cwd(), 'test-results');

  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'speaking-pose.json'), JSON.stringify({ still, animated, observations }, null, 2) + '\n');
});
