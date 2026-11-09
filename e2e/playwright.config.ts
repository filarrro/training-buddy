import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  outputDir: '../test-results',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    // iPhone 13 viewport/touch in Chromium, but an Android user agent: an iOS UA would route the
    // first launch to the "install to home screen" screen (FR36), which is covered separately.
    ...devices['iPhone 13'],
    userAgent: devices['Pixel 7'].userAgent,
    defaultBrowserType: 'chromium',
    browserName: 'chromium',
    locale: 'pl-PL',
    reducedMotion: 'reduce',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'mobile-chromium' }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    cwd: '..',
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
