import { defineConfig, devices } from '@playwright/test'

const repo = 'subtime'
const port = 4173
const host = '127.0.0.1'
const baseURL = `http://${host}:${port}/${repo}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'iphone',
      // Keep iPhone 12 viewport/UA; use Chromium so tests run after `playwright install` only (no WebKit).
      use: {
        ...devices['iPhone 12'],
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command: `vite preview --host ${host} --port ${String(port)}`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
