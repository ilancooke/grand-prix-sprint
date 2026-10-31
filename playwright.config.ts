import { defineConfig, devices } from '@playwright/test';
import { LOCAL_ORIGIN } from './config/server';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: LOCAL_ORIGIN, viewport: { width: 1280, height: 800 }, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: { command: 'npm run dev', url: LOCAL_ORIGIN, reuseExistingServer: !process.env.CI },
});
