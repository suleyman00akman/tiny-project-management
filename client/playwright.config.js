import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false, // Run tests sequentially for better reliability
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1, // Retry once on failure
    workers: 1, // Single worker for sequential execution
    reporter: 'html',
    timeout: 90000, // 90 seconds per test
    expect: {
        timeout: 10000 // 10 seconds for assertions
    },
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 15000, // 15 seconds for actions
        navigationTimeout: 30000, // 30 seconds for navigation
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'echo "Server should already be running on port 8080"',
        url: 'http://localhost:8080',
        reuseExistingServer: true,
        timeout: 120000, // 2 minutes to wait for server
    },
});

