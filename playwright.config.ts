import { defineConfig, devices } from '@playwright/test';

// A caller can choose a different port when running claims alongside another
// local check. The ordinary suite deliberately uses two workers; browser state
// and mocked room state are isolated by the tests themselves.
const port = Number(process.env.PLAYWRIGHT_PORT || '4173');
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run preview -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false
  }
});
