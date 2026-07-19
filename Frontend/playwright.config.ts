import { defineConfig, devices } from '@playwright/test';

const ci = Boolean(process.env.CI);
const baseURL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    forbidOnly: ci,
    retries: ci ? 2 : 0,
    workers: ci ? 2 : undefined,
    reporter: ci
        ? [
              ['line'],
              ['github'],
              ['html', { outputFolder: 'playwright-report', open: 'never' }],
          ]
        : [
              ['list'],
              ['html', { outputFolder: 'playwright-report', open: 'never' }],
          ],
    use: {
        baseURL,
        headless: process.env.HEADED !== '1',
        trace: 'on-first-retry',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        locale: 'fr-FR',
        timezoneId: 'Africa/Abidjan',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer:
        process.env.PW_SKIP_WEBSERVER === '1'
            ? undefined
            : {
                  command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
                  url: baseURL,
                  reuseExistingServer: !ci,
                  timeout: 120_000,
              },
});
