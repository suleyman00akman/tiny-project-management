import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('TinyPM Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Set HOME environment variable for this test
        process.env.HOME = process.env.USERPROFILE || process.env.HOME;
    });

    test('should load the landing page', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await expect(page).toHaveTitle(/Tiny PM/);
        await page.screenshot({ path: 'test-results/landing-page.png', fullPage: true });
    });

    test('should show login page after setup', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForLoadState('networkidle');

        // Click Sign In if on Landing Page
        const signInButton = page.locator('button:has-text("Sign In")');
        if (await signInButton.isVisible()) {
            await signInButton.click();
            await page.waitForTimeout(500);
        }

        // Check if we're on login or setup
        const hasLogin = await page.locator('input[type="password"]').count();
        if (hasLogin > 0) {
            await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
        }
    });

    test('should display task list with inline editing', async ({ page }) => {
        // Login first
        await loginUser(page, 'user200', 'password123');

        await page.goto('http://localhost:8080/projects');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-results/project-view.png', fullPage: true });
    });

    test('should show kanban view', async ({ page }) => {
        // Login first
        await loginUser(page, 'user200', 'password123');

        await page.goto('http://localhost:8080/tasks');
        await page.waitForLoadState('networkidle');

        // Click on "My Kanban" button if it exists
        const kanbanButton = page.getByText('My Kanban');
        if (await kanbanButton.count() > 0) {
            await kanbanButton.click();
            await page.screenshot({ path: 'test-results/kanban-view.png', fullPage: true });
        }
    });
});
