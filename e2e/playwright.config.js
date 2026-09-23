import { defineConfig, devices } from '@playwright/test'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { BACKEND_PORT, FRONTEND_PORT, BACKEND_URL, FRONTEND_URL } from './env.js'

// Spin up a fully separate, temporary MongoDB process just for the tests —
// no test ever touches the real (production) database on Atlas/Render.
// The same approach works both locally and in GitHub Actions, without Docker.
const mongod = await MongoMemoryServer.create({ instance: { dbName: 'sneakerShop' } })
const MONGODB_URI = mongod.getUri('sneakerShop')

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/local/results.json' }],

    // HTML report — for humans (Testiraportit / HTML)
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // JSON report — for the Flutter Dashboard (Testiraportit / JSON)
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    // Full trace (including network requests) for failed tests — lets us see
    // exactly which address the browser's request went to.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Playwright itself starts the backend and the frontend before the tests
  // and shuts them down afterwards — nothing needs to be started manually.
  webServer: [
    {
      // "npm run dev" turns on node --watch, which is meant for manual
      // development (auto-restart on file changes) and can be unstable when
      // run in the background on Windows. For tests we use a plain start
      // without watch.
      command: 'npm start',
      cwd: '../backend',
      url: `${BACKEND_URL}/`,
      env: {
        MONGODB_URI,
        JWT_SECRET: 'test-secret-for-e2e-only',
        PORT: String(BACKEND_PORT),
        // Enables /api/test/promote-admin — only needed for the admin tests.
        ENABLE_TEST_ROUTES: 'true',
      },
      reuseExistingServer: false,
      timeout: 30_000,
      // Stream the backend's logs to the terminal — if it crashes or can't
      // connect to the database, we'll see the real reason instead of just
      // an ECONNRESET in the test.
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      cwd: '../frontend',
      url: FRONTEND_URL,
      env: {
        VITE_API_URL: `${BACKEND_URL}/api`,
      },
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})