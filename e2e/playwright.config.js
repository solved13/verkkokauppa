import { defineConfig, devices } from '@playwright/test'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { BACKEND_PORT, FRONTEND_PORT, BACKEND_URL, FRONTEND_URL } from './env.js'

// Піднімаємо повністю окремий, тимчасовий MongoDB-процес тільки для тестів —
// жоден тест ніколи не торкається реальної (продакшн) бази на Atlas/Render.
// Той самий підхід працює і локально, і в GitHub Actions — без Docker.
const mongod = await MongoMemoryServer.create({ instance: { dbName: 'sneakerShop' } })
const MONGODB_URI = mongod.getUri('sneakerShop')

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    // HTML-звіт — для людини (Testiraportit / HTML)
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // JSON-звіт — для Flutter Dashboard (Testiraportit / JSON)
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    // Повний трейс (з мережевими запитами) для провалених тестів —
    // дозволяє побачити, на яку саме адресу пішов запит з браузера.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Playwright сам піднімає backend і frontend перед тестами
  // і гасить їх після — не треба нічого запускати вручну.
  webServer: [
    {
      // "npm run dev" вмикає node --watch, який призначений для ручної розробки
      // (автоперезапуск при зміні файлів) і на Windows буває нестабільним у
      // фоновому режимі. Для тестів беремо звичайний запуск без watch.
      command: 'npm start',
      cwd: '../backend',
      url: `${BACKEND_URL}/`,
      env: {
        MONGODB_URI,
        JWT_SECRET: 'test-secret-for-e2e-only',
        PORT: String(BACKEND_PORT),
        // Вмикає /api/test/promote-admin — потрібен тільки для тестів адмінки.
        ENABLE_TEST_ROUTES: 'true',
      },
      reuseExistingServer: false,
      timeout: 30_000,
      // Показуємо логи backend у терміналі — якщо він впаде чи не з'єднається
      // з базою, побачимо справжню причину, а не тільки ECONNRESET у тесті.
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
