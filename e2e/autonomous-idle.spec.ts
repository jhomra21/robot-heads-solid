import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

test('idle head glances autonomously without pointer input', async ({ page }) => {
  await page.goto('/?shape=rectangle&state=idle');
  await expect(page.getByRole('heading', { name: 'Idle' })).toBeVisible();

  // Drive the same Simulation module as the preview in a browser, using fixed
  // time steps so rAF scheduling and the always-moving idle bob cannot hide a
  // missing glance. HEAD before the refactor supplies the seeded baseline.
  const simPath = new URL('../src/tv/sim.ts', import.meta.url).pathname;

  const observations = await page.evaluate(async (url) => {
    const { RobotSim } = await import(url);
    const sim = new RobotSim(0.5, 'idle');
    sim.pointer = null;
    const samples = [];

    for (let frame = 1; frame <= 120; frame++) {
      sim.update(1 / 60);

      if (frame === 30 || frame === 120) {
        samples.push({
          frame, yaw: sim.pose.yaw, pitch: sim.pose.pitch,
          lookX: sim.face.lookX, lookY: sim.face.lookY,
        });
      }
    }

    return { pointer: sim.pointer, samples };
  }, `/@fs${simPath}`);

  const out = join(process.cwd(), 'test-results', 'autonomous-idle');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'seed-0.5-120-frames.json'), JSON.stringify(observations, null, 2) + '\n');
  await page.screenshot({ path: join(out, 'idle-preview.png') });

  expect(observations.pointer).toBeNull();
  expect(observations.samples[0].yaw).toBeCloseTo(0, 6);
  expect(observations.samples[1].yaw).toBeCloseTo(-0.08607680778159477, 6);
  expect(observations.samples[1].pitch).toBeCloseTo(-0.024876041479218063, 6);
  expect(observations.samples[1].lookY).toBe(-1);
});
