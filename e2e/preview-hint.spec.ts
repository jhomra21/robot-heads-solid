import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const evidence = 'test-results/preview-hint';

test('preview hint stays in the first viewport and clear of the dock', async ({ page }) => {
  await mkdir(evidence, { recursive: true });

  for (const [width, height] of [[320, 640], [375, 640], [390, 640], [375, 812], [390, 844], [1280, 660]]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/?shape=hexagon&state=thinking&paused');
    await page.evaluate(() => document.fonts.ready);
    const hint = await page.locator('.caption p').boundingBox();
    const dock = await page.locator('.dock').boundingBox();
    expect(hint).not.toBeNull();
    expect(dock).not.toBeNull();
    expect(hint!.y, `${width}x${height}: hint starts below viewport`).toBeGreaterThanOrEqual(0);
    expect(hint!.y + hint!.height, `${width}x${height}: hint outside first viewport`).toBeLessThanOrEqual(height);
    const overlapX = hint!.x < dock!.x + dock!.width && dock!.x < hint!.x + hint!.width;
    const overlapY = hint!.y < dock!.y + dock!.height && dock!.y < hint!.y + hint!.height;
    expect(overlapX && overlapY, `${width}x${height}: dock overlaps preview hint`).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}x${height}: horizontal overflow`).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${evidence}/${width}x${height}-viewport.png` });
  }
});
