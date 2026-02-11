import { test, expect } from '@playwright/test';

test.describe('Inline Editing Tests', () => {
    test.beforeEach(async ({ page }) => {
        process.env.HOME = process.env.USERPROFILE || process.env.HOME;
        await page.goto('http://localhost:8080');
    });

    test('should NOT open task details when clicking task text', async ({ page }) => {
        // Navigate to tasks page
        await page.goto('http://localhost:8080/tasks');
        await page.waitForLoadState('networkidle');

        // Wait for tasks to load
        await page.waitForTimeout(1000);

        // Find a task text element (not the comment button)
        const taskText = page.locator('.todo-text').first();

        if (await taskText.count() > 0) {
            // Click on the task text
            await taskText.click();

            // Wait a moment for any modal to potentially appear
            await page.waitForTimeout(500);

            // Check that Task Details modal is NOT visible
            const taskDetailsModal = page.locator('text=Task Details');
            const isVisible = await taskDetailsModal.isVisible().catch(() => false);

            expect(isVisible).toBe(false);
            console.log('✅ Task Details modal did NOT open when clicking task text');

            await page.screenshot({ path: 'test-results/inline-edit-active.png', fullPage: true });
        } else {
            console.log('⚠️ No tasks found to test');
        }
    });

    test('should open task details when clicking comment button', async ({ page }) => {
        await page.goto('http://localhost:8080/tasks');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find the comment button (💬)
        const commentButton = page.locator('button[title="Comments & Details"]').first();

        if (await commentButton.count() > 0) {
            await commentButton.click();
            await page.waitForTimeout(500);

            // Check that Task Details modal IS visible
            const taskDetailsModal = page.locator('text=Task Details');
            await expect(taskDetailsModal).toBeVisible();

            console.log('✅ Task Details modal opened when clicking comment button');
            await page.screenshot({ path: 'test-results/task-details-modal.png', fullPage: true });
        } else {
            console.log('⚠️ No comment buttons found');
        }
    });

    test('should show inline edit controls when clicking edit icon', async ({ page }) => {
        await page.goto('http://localhost:8080/tasks');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find the edit button (✎)
        const editButton = page.locator('button[title="Edit Inline"]').first();

        if (await editButton.count() > 0) {
            await editButton.click();
            await page.waitForTimeout(500);

            // Check for Save and Cancel buttons
            const saveButton = page.locator('button:has-text("Save")').first();
            const cancelButton = page.locator('button:has-text("Cancel")').first();

            await expect(saveButton).toBeVisible();
            await expect(cancelButton).toBeVisible();

            console.log('✅ Inline edit controls are visible');
            await page.screenshot({ path: 'test-results/inline-edit-controls.png', fullPage: true });
        } else {
            console.log('⚠️ No edit buttons found');
        }
    });
});
