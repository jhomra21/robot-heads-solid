import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: 'test-results/consumer-playwright',
  testDir: './e2e', testMatch: 'consumer.consumer.spec.ts',
  use: { browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command: 'cd e2e/consumer && bunx vite --force --host 127.0.0.1 --port 4175',
    url: 'http://127.0.0.1:4175', timeout: 120000, reuseExistingServer: false,
  },
});
