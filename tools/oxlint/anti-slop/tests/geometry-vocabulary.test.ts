import { expect, test } from 'bun:test';
import { unlinkSync } from 'node:fs';

const repository = new URL('../../../../', import.meta.url).pathname;
const fixture = `${repository}e2e/.geometry-vocabulary-fixture.ts`;

test('real geometric domain vocabulary remains valid while vague data shape names fail', async () => {
  await Bun.write(fixture, `
    export type RobotHeadShape = 'circle' | 'square';
    export const robotHeadShapes: RobotHeadShape[] = ['circle', 'square'];
    const shape = robotHeadShapes[0];
    const requestShape = { arbitrary: true };
    void shape;
    void requestShape;
  `);
  try {
    const run = Bun.spawnSync(
      ['bunx', 'oxlint', '--format', 'json', fixture],
      { cwd: repository },
    );
    const output = JSON.parse(run.stdout.toString()) as {
      diagnostics: Array<{ code: string; message: string }>;
    };
    const names = output.diagnostics
      .filter((diagnostic) => diagnostic.code === 'anti-slop(no-shape-in-symbol-names)')
      .map((diagnostic) => diagnostic.message);
    expect(names).toHaveLength(2);
    expect(names.every((name) => name.includes('requestShape'))).toBe(true);
  } finally {
    unlinkSync(fixture);
  }
});
