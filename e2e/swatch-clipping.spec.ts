import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const evidence = 'test-results/swatch-clipping';

// The selected swatch draws a 3px box-shadow ring outside its 20px box.
// Any ancestor with overflow other than visible clips that ring.
const RING = 3;

test('selected swatch rings are not clipped by the controls column', async ({ page }) => {
  await mkdir(evidence, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  for (const [width, height] of [[1280, 800], [1280, 660], [320, 640], [375, 640], [375, 812]]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/?shape=hexagon&state=thinking&paused');
    await page.evaluate(() => document.fonts.ready);

    const swatches = page.locator('.controls .swatch');
    const count = await swatches.count();
    expect(count, `${width}x${height}: swatches present`).toBeGreaterThan(0);

    const clipped = await page.evaluate((ring) => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>('.controls .swatch[aria-pressed="true"]').forEach((el, i) => {
        const r = el.getBoundingClientRect();

        const ringRect = {
          left: r.left - ring, right: r.right + ring,
          top: r.top - ring, bottom: r.bottom + ring,
        };

        let node = el.parentElement;

        while (node && node !== document.body) {
          const cs = getComputedStyle(node);
          const clips = [cs.overflowX, cs.overflowY].some((v) => v !== 'visible');

          if (clips) {
            const c = node.getBoundingClientRect();

            if (ringRect.left < c.left) out.push(`swatch ${i}: ring left ${ringRect.left.toFixed(1)} clipped by ${node.className} at ${c.left.toFixed(1)}`);

            if (ringRect.right > c.right) out.push(`swatch ${i}: ring right ${ringRect.right.toFixed(1)} clipped by ${node.className} at ${c.right.toFixed(1)}`);

            if (ringRect.top < c.top) out.push(`swatch ${i}: ring top ${ringRect.top.toFixed(1)} clipped by ${node.className} at ${c.top.toFixed(1)}`);

            if (ringRect.bottom > c.bottom) out.push(`swatch ${i}: ring bottom ${ringRect.bottom.toFixed(1)} clipped by ${node.className} at ${c.bottom.toFixed(1)}`);
          }

          node = node.parentElement;
        }
      });

      return out;
    }, RING);

    expect(clipped, `${width}x${height}: selected swatch ring clipped`).toEqual([]);

    // Hit areas and focus stay intact: every swatch is still a visible, reachable control.
    for (let i = 0; i < count; i++) {
      const box = await swatches.nth(i).boundingBox();
      expect(box, `${width}x${height}: swatch ${i} box`).not.toBeNull();
      expect(box!.width, `${width}x${height}: swatch ${i} width`).toBeGreaterThanOrEqual(19);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}x${height}: horizontal overflow`).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${evidence}/${width}x${height}.png`, fullPage: false });
  }

  expect(errors).toEqual([]);
});
