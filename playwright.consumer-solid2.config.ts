import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: 'test-results/consumer-solid2-playwright',
  testDir: './e2e',
  testMatch: 'consumer-solid2.consumer.spec.ts',
  use: { browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command: 'cd e2e/consumer-solid2 && bunx vite --host 127.0.0.1 --port 4176',
    url: 'http://127.0.0.1:4176',
    timeout: 120000,
    reuseExistingServer: false,
  },
});
