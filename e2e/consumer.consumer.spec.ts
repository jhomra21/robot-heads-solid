import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

test('published tarball loads and reacts in an external Solid 1 application', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:4175/');
  const canvas = page.locator('canvas[data-consumer="true"]');
  await expect(canvas).toHaveAttribute('aria-label', 'consumer idle');
  await expect(page.locator('#ref')).toHaveText('CANVAS');
  const before = await canvas.screenshot();
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(canvas).toHaveAttribute('aria-label', 'consumer error');
  const after = await canvas.screenshot();
  expect(before.equals(after)).toBe(false);
  await page.getByRole('button', { name: 'Toggle pause' }).click();
  await page.waitForTimeout(120);
  mkdirSync('test-results', { recursive: true });
  await canvas.screenshot({ path: 'test-results/consumer-solid1-after.png' });
  writeFileSync('test-results/consumer-solid1-browser.json',
    JSON.stringify({ errors, beforeBytes: before.length, afterBytes: after.length, changed: !before.equals(after) }, null, 2));
  expect(errors).toEqual([]);
});
