import { expect, test } from '@playwright/test';

test('the masthead remains reachable without horizontal scrolling', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  for (const width of [320, 375, 390, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/?shape=hexagon&state=working');
    await expect(page.locator('.masthead-end .theme')).toBeVisible();
    const bounds = await page.locator('.masthead-end .theme').boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x + bounds!.width, `${width}px: theme control`).toBeLessThanOrEqual(width);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, `${width}px: horizontal overflow`).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/mobile-${width}.png`, fullPage: true });
  }

  expect(errors).toEqual([]);
});
