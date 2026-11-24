import { expect, test } from '@playwright/test';

test('the resting box owns layout while its canvas overflows', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('main.stage [role="img"]');
  const canvas = root.locator('canvas');

  await expect(root).toHaveJSProperty('tagName', 'SPAN');

  const geometry = await root.evaluate(async (element) => {
    const box = element.getBoundingClientRect();
    const drawing = element.querySelector('canvas')!.getBoundingClientRect();

    const flex = document.createElement('div');
    flex.style.cssText = 'display:flex;position:fixed;left:-10000px;top:0';
    // SAFETY: root was queried by [role="img"] and the test above verifies it is a span.
    const head = element.cloneNode(true) as HTMLSpanElement;
    const sibling = document.createElement('span');
    sibling.style.cssText = 'width:20px;height:20px;flex:none';
    flex.append(head, sibling);
    document.body.append(flex);
    const siblingGap = sibling.getBoundingClientRect().left - head.getBoundingClientRect().right;
    flex.remove();

    return {
      width: box.width,
      height: box.height,
      canvasWidth: drawing.width,
      canvasHeight: drawing.height,
      cssWidth: Number.parseFloat(getComputedStyle(element).width),
      cssHeight: Number.parseFloat(getComputedStyle(element).height),
      expectedSize: Math.round(Math.max(
        170,
        Math.min(Math.min(window.innerWidth - 760, window.innerHeight - 300) * 0.62, 330),
      )),
      siblingGap,
    };
  });

  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.width).toBe(geometry.expectedSize);
  expect(geometry.width).toBe(geometry.cssWidth);
  expect(geometry.height).toBe(geometry.cssHeight);
  expect(geometry.height).toBe(geometry.width);
  expect(geometry.canvasWidth).toBeGreaterThan(geometry.width);
  expect(geometry.canvasHeight).toBeGreaterThan(geometry.height);
  expect(geometry.siblingGap).toBe(0);
  await expect(canvas).toHaveAttribute('aria-hidden', 'true');
});

test('antenna off removes the stem and lets compact heads grow', async ({ page }) => {
  await page.goto('/?paused');

  const pixelStats = async () => page.locator('main.stage canvas').evaluate((element) => {
    // SAFETY: this locator matches the nested canvas under main.stage.
    const canvas = element as HTMLCanvasElement;

    const { data, width, height } = canvas.getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height);

    const occupiedRows = Array.from({ length: height }, () => 0);

    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 180) occupiedRows[y]++;
    }

    const bodyTop = occupiedRows.findIndex((count) => count >= width * 0.2);
    let opaqueAboveHead = 0;
    let minX = width, maxX = 0, minY = height, maxY = 0;

    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= 180) continue;

      if (y < bodyTop) opaqueAboveHead++;

      if (y >= bodyTop) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }

    return {
      opaqueAboveHead, bbox: (maxX - minX) * (maxY - minY),
    };
  });

  for (const shape of ['square', 'circle', 'hexagon']) {
    await page.getByRole('button', { name: shape[0].toUpperCase() + shape.slice(1), exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`shape=${shape}`));
    await page.getByRole('group', { name: 'Antenna' }).getByRole('button', { name: 'On' }).click();
    const on = await pixelStats();
    await page.getByRole('group', { name: 'Antenna' }).getByRole('button', { name: 'Off' }).click();
    const off = await pixelStats();
    expect(off.opaqueAboveHead, JSON.stringify({ shape, on, off })).toBeLessThan(on.opaqueAboveHead * 0.5);
    expect(off.bbox, JSON.stringify({ shape, on, off })).toBeGreaterThan(on.bbox);
  }
});

test('antenna control updates snippet, URL, reload state, and Reset', async ({ page }) => {
  await page.goto('/');
  const controls = page.getByRole('group', { name: 'Antenna' });
  await expect(controls.getByRole('button', { name: 'On' })).toHaveAttribute('aria-pressed', 'true');
  await controls.getByRole('button', { name: 'Off' }).click();
  await expect(page.locator('.code')).toContainText('antenna={false}');
  await expect(page).toHaveURL(/noantenna/);
  await page.reload();
  await expect(page.getByRole('group', { name: 'Antenna' }).getByRole('button', { name: 'Off' }))
    .toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByRole('group', { name: 'Antenna' }).getByRole('button', { name: 'On' }))
    .toHaveAttribute('aria-pressed', 'true');
});
