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

test('the Solid porter and React creator credits stay readable across screen sizes', async ({ page }) => {
  for (const width of [320, 375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const porter = page.getByRole('link', { name: 'jhomra21' });
    const creator = page.getByRole('link', { name: 'Fayaz Ahmed' });
    await expect(porter).toHaveAttribute('href', 'https://github.com/jhomra21');
    await expect(creator).toHaveAttribute('href', 'https://github.com/fayazara/robot-heads');
    await expect(page.locator('.byline')).toContainText('Solid port by');
    await expect(page.locator('.byline')).toContainText('React original by');
    await expect(porter).toBeVisible();
    await expect(creator).toBeVisible();

    const byline = await page.locator('.byline').boundingBox();
    const mastheadEnd = await page.locator('.masthead-end').boundingBox();
    expect(byline).not.toBeNull();
    expect(mastheadEnd).not.toBeNull();
    expect(byline!.x + byline!.width, `${width}px: attribution stays in viewport`).toBeLessThanOrEqual(width);
    expect(mastheadEnd!.x + mastheadEnd!.width, `${width}px: controls stay in viewport`).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px: no horizontal overflow`).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/attribution-${width}.png`, fullPage: true });
  }
});
