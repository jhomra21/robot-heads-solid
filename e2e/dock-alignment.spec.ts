import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const headLabels = ['Rectangle', 'Square', 'Circle', 'Hexagon'];

const artifactDir = 'test-results/dock-alignment';

const capture = process.env.DOCK_CAPTURE ?? 'after';

test('dock shapes stay centered and contained on phones and desktop', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(artifactDir, { recursive: true });
  const results = [];

  for (const [width, height] of [[320, 640], [375, 812], [390, 844], [554, 170], [1280, 800]]) {
    await page.setViewportSize({ width, height });

    for (const theme of ['dark', 'light']) {
      for (const paused of [true, false]) {
        for (const porcelain of [false, true]) {
          await page.goto(`/?shape=rectangle&state=idle${paused ? '&paused' : ''}`);
          await page.mouse.move(0, 0);

          if (await page.evaluate(() => document.documentElement.dataset.theme) !== theme) {
            await page.locator('.theme').click();
          }

          if (porcelain) {
            await page.getByRole('button', { name: 'Shell: Porcelain' }).click();
          }

          await expect(page.locator('.dock canvas')).toHaveCount(4);
          await page.waitForTimeout(paused ? 100 : 350);

          const data = await page.locator('.dock').evaluate((dock) => {
            const pill = dock.getBoundingClientRect();

            const measurements = Array.from(dock.querySelectorAll<HTMLButtonElement>('.dock-item')).map((button) => {
              const canvas = button.querySelector('canvas')!;
              const ctx = canvas.getContext('2d')!;
              const { width, height } = canvas;
              const pixels = ctx.getImageData(0, 0, width, height).data;
              let minX = width, minY = height, maxX = -1, maxY = -1;
              const occupiedRows = Array.from({ length: height }, () => 0);

              for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                  // Measure the rendered head, not its soft canvas glow. Canvas
                  // alpha is read before the dock icon's CSS opacity is applied.
                  if (pixels[(y * width + x) * 4 + 3] < 180) continue;
                  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                  occupiedRows[y]++;
                }
              }

              const bodyTop = occupiedRows.findIndex((count) => count >= width * 0.2);
              const rect = canvas.getBoundingClientRect();
              const slot = button.getBoundingClientRect();

              const head = {
                left: rect.left + minX / width * rect.width,
                right: rect.left + (maxX + 1) / width * rect.width,
                top: rect.top + minY / height * rect.height,
                bottom: rect.top + (maxY + 1) / height * rect.height,
                bodyTop: rect.top + bodyTop / height * rect.height,
              };

              return {
                shape: button.getAttribute('aria-label'),
                slot: { left: slot.left, right: slot.right, top: slot.top, bottom: slot.bottom },
                head,
                topGap: head.top - pill.top,
                bottomGap: pill.bottom - head.bottom,
                centerOffsetX: (head.left + head.right - slot.left - slot.right) / 2,
                centerOffsetY: (head.top + head.bottom - slot.top - slot.bottom) / 2,
                bodyHeight: head.bottom - head.bodyTop,
                clipped: minX === 0 || maxX === width - 1 || minY === 0 || maxY === height - 1,
              };
            });

            return {
              pill: { left: pill.left, right: pill.right, top: pill.top, bottom: pill.bottom },
              viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
              heads: measurements,
            };
          });

          expect(data.heads.map((head) => head.shape)).toEqual(headLabels);
          const mode = `${width}x${height}-${theme}-${paused ? 'paused' : 'active'}-${porcelain ? 'porcelain' : 'default'}`;
          results.push({ mode, ...data });
          await page.locator('.dock').screenshot({ path: `${artifactDir}/${capture}-${mode}-dock.png`, animations: 'disabled' });
          await page.screenshot({ path: `${artifactDir}/${capture}-${mode}-viewport.png`, animations: 'disabled' });

        }
      }
    }
  }

  await writeFile(`${artifactDir}/${capture}-measurements.json`, JSON.stringify(results, null, 2));

  for (const { mode, pill, viewport, heads: entries } of results) {
    expect(viewport.scrollWidth, `${mode}: no horizontal page overflow`).toBeLessThanOrEqual(viewport.width);
    expect(pill.left, `${mode}: pill left in viewport`).toBeGreaterThanOrEqual(0);
    expect(pill.right, `${mode}: pill right in viewport`).toBeLessThanOrEqual(viewport.width);

    for (const shape of entries) {
      expect(shape.clipped, `${mode}/${shape.shape}: canvas clipping`).toBe(false);
      expect(shape.head.top, `${mode}/${shape.shape}: pill top`).toBeGreaterThanOrEqual(pill.top);
      expect(shape.head.bottom, `${mode}/${shape.shape}: pill bottom`).toBeLessThanOrEqual(pill.bottom);
      expect(shape.head.left, `${mode}/${shape.shape}: viewport left`).toBeGreaterThanOrEqual(0);
      expect(shape.head.right, `${mode}/${shape.shape}: viewport right`).toBeLessThanOrEqual(viewport.width);
      expect(Math.abs(shape.centerOffsetX), `${mode}/${shape.shape}: x alignment`).toBeLessThan(7);

      if (mode.includes('-paused-') && Number(mode.split('x')[0]) <= 900) {
        expect(Math.abs(shape.topGap - shape.bottomGap), `${mode}/${shape.shape}: visible head-to-pill vertical gap`)
          .toBeLessThanOrEqual(0.5);
      }
    }

    const widths = entries.map((shape) => shape.head.right - shape.head.left);
    expect(Math.max(...widths) / Math.min(...widths), `${mode}: relative head width`)
      .toBeLessThan(mode.includes('-paused-') ? 1.13 : 1.17);

    const heights = entries.map((shape) => shape.bodyHeight);
    expect(Math.max(...heights) / Math.min(...heights), `${mode}: relative body size`).toBeLessThan(1.3);
  }
});
