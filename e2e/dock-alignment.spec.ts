import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const headLabels = ['Rectangle', 'Square', 'Circle', 'Hexagon'];

const artifactDir = 'test-results/dock-alignment';

const capture = process.env.DOCK_CAPTURE ?? 'after';

test('dock shapes stay centered and contained on phones and desktop', async ({ page }) => {
  await mkdir(artifactDir, { recursive: true });
  const results = [];

  for (const [width, height] of [[320, 800], [375, 812], [390, 844], [1280, 800]]) {
    await page.setViewportSize({ width, height });

    for (const paused of [true, false]) {
      await page.goto(`/?shape=rectangle&state=working${paused ? '&paused' : ''}`);
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
              if (pixels[(y * width + x) * 4 + 3] < 32) continue;
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
            centerOffsetX: (head.left + head.right - slot.left - slot.right) / 2,
            centerOffsetY: (head.top + head.bottom - slot.top - slot.bottom) / 2,
            bodyHeight: head.bottom - head.bodyTop,
            clipped: minX === 0 || maxX === width - 1 || minY === 0 || maxY === height - 1,
          };
        });

        return {
          pill: { left: pill.left, right: pill.right, top: pill.top, bottom: pill.bottom },
          heads: measurements,
        };
      });

      expect(data.heads.map((head) => head.shape)).toEqual(headLabels);
      const mode = `${width}-${paused ? 'paused' : 'active'}`;
      results.push({ mode, ...data });
      await page.locator('.dock').screenshot({ path: `${artifactDir}/${capture}-${mode}-dock.png`, animations: 'disabled' });
      await page.screenshot({ path: `${artifactDir}/${capture}-${mode}-viewport.png`, animations: 'disabled' });

      for (const shape of headLabels) {
        await page.getByRole('button', { name: shape, exact: true }).click();
        await expect(page.getByRole('button', { name: shape, pressed: true })).toBeVisible();
      }
    }
  }

  await writeFile(`${artifactDir}/${capture}-measurements.json`, JSON.stringify(results, null, 2));

  for (const { mode, pill, heads: entries } of results) {
    for (const shape of entries) {
      expect(shape.clipped, `${mode}/${shape.shape}: canvas clipping`).toBe(false);
      expect(shape.head.top, `${mode}/${shape.shape}: pill top`).toBeGreaterThanOrEqual(pill.top + 2);
      expect(shape.head.bottom, `${mode}/${shape.shape}: pill bottom`).toBeLessThanOrEqual(pill.bottom - 2);
      expect(Math.abs(shape.centerOffsetX), `${mode}/${shape.shape}: x alignment`).toBeLessThan(7);
      expect(Math.abs(shape.centerOffsetY), `${mode}/${shape.shape}: y alignment`).toBeLessThan(2.5);
    }

    const widths = entries.map((shape) => shape.head.right - shape.head.left);
    expect(Math.max(...widths) / Math.min(...widths), `${mode}: relative head width`)
      .toBeLessThan(mode.endsWith('paused') ? 1.13 : 1.17);

    const heights = entries.map((shape) => shape.bodyHeight);
    expect(Math.max(...heights) / Math.min(...heights), `${mode}: relative body size`).toBeLessThan(1.3);
  }
});
