import { expect, test } from '@playwright/test';

test('shape, state, paint, appearance, and pause controls work in Solid', async ({ page }) => {
  await page.goto('/?shape=rectangle&state=idle');
  await expect(page.getByRole('heading', { name: 'Idle' })).toBeVisible();
  await expect(page.locator('nav[aria-label="Shape"] .dock-item')).toHaveCount(4);
  await expect(page.locator('nav[aria-label="State"] .state')).toHaveCount(9);

  for (const shape of ['Rectangle', 'Square', 'Circle', 'Hexagon']) {
    await page.getByRole('button', { name: shape, exact: true }).click();
    await expect(page).toHaveURL(new RegExp('shape=' + shape.toLowerCase()));
  }
  for (const state of ['Thinking', 'Searching', 'Listening', 'Speaking', 'Working', 'Happy', 'Error', 'Sleeping', 'Idle']) {
    await page.locator('nav[aria-label="State"]').getByRole('button', { name: state, exact: true }).click();
    await expect(page.getByRole('heading', { name: state })).toBeVisible();
  }

  const painted = await page.locator('main.stage canvas').evaluate((canvas) => {
    const c = canvas as HTMLCanvasElement;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx || !c.width || !c.height) return false;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
    return false;
  });
  expect(painted).toBe(true);

  await page.getByRole('button', { name: 'Tomato' }).click();
  await expect(page.locator('aside.controls .code')).toContainText('color="#c8372d"');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.locator('aside.controls .code .code-prop').nth(2)).toHaveAttribute('data-open', 'false');
  await expect(page.getByRole('button', { name: 'Shell: Cobalt' })).toHaveAttribute('aria-pressed', 'true');

  await page.screenshot({ path: 'test-results/robot-heads-solid.png', fullPage: true });
});
