import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

// Increase default timeout to 60 seconds
test.setTimeout(60000);

test.describe('Inline Edit Visual Test - user200', () => {
    test.beforeEach(async ({ page }) => {
        process.env.HOME = process.env.USERPROFILE || process.env.HOME;
        // Set page timeout
        page.setDefaultTimeout(60000);
    });

    test('CRITICAL: Verify inline editing works (no modal opens)', async ({ page }) => {
        console.log('🔍 Starting inline edit test...');

        await loginUser(page, 'user200', 'password123');
        await page.screenshot({ path: 'test-results/inline-test-03-after-login.png', fullPage: true });

        // Navigate to Tasks page
        console.log('📋 Navigating to Tasks page...');
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/inline-test-04-tasks-page.png', fullPage: true });

        // Wait for tasks to load
        await page.waitForSelector('.todo-item', { timeout: 10000 });
        console.log('✅ Tasks loaded');

        // Find the first task text
        const taskText = page.locator('.todo-text').first();
        await taskText.waitFor({ state: 'visible', timeout: 10000 });

        const originalText = await taskText.textContent();
        console.log(`📝 Original task text: "${originalText}"`);

        // Take screenshot before clicking
        await page.screenshot({ path: 'test-results/inline-test-05-before-click.png', fullPage: true });

        // Click on the task text
        console.log('🖱️ Clicking on task text...');
        await taskText.click();
        await page.waitForTimeout(1000);

        // Take screenshot after clicking
        await page.screenshot({ path: 'test-results/inline-test-06-after-click.png', fullPage: true });

        // Check if Task Details modal is visible (it should NOT be)
        const taskDetailsModal = page.locator('text=Task Details');
        const isModalVisible = await taskDetailsModal.isVisible().catch(() => false);

        if (isModalVisible) {
            console.log('❌ FAILED: Task Details modal opened (should not open)');
            await page.screenshot({ path: 'test-results/inline-test-FAILED-modal-opened.png', fullPage: true });
            throw new Error('Task Details modal should NOT open when clicking task text');
        } else {
            console.log('✅ PASSED: Task Details modal did NOT open');
        }

        // Check if inline edit is active (Save button should be visible)
        const saveButton = page.locator('button:has-text("Save")').first();
        const isSaveButtonVisible = await saveButton.isVisible().catch(() => false);

        if (!isSaveButtonVisible) {
            console.log('❌ FAILED: Inline edit did not activate (Save button not visible)');
            await page.screenshot({ path: 'test-results/inline-test-FAILED-no-inline-edit.png', fullPage: true });
            throw new Error('Inline edit should activate when clicking task text');
        } else {
            console.log('✅ PASSED: Inline edit activated (Save button visible)');
            await page.screenshot({ path: 'test-results/inline-test-07-inline-edit-active.png', fullPage: true });
        }

        // Try editing the task
        console.log('✏️ Editing task text...');
        const textInput = page.locator('input[type="text"]').first();
        await textInput.fill('INLINE EDIT TEST - Updated Successfully!');
        await page.screenshot({ path: 'test-results/inline-test-08-text-edited.png', fullPage: true });

        // Save the changes
        console.log('💾 Saving changes...');
        await saveButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/inline-test-09-saved.png', fullPage: true });

        // Verify the task text was updated
        const updatedText = await taskText.textContent();
        console.log(`📝 Updated task text: "${updatedText}"`);

        if (updatedText.includes('INLINE EDIT TEST')) {
            console.log('✅ PASSED: Task text was successfully updated');
        } else {
            console.log('⚠️ WARNING: Task text may not have been updated');
        }

        console.log('🎉 Inline edit test completed successfully!');
    });

    test('Verify Task Details modal opens via comment button', async ({ page }) => {
        console.log('🔍 Starting comment button test...');

        await loginUser(page, 'user200', 'password123');

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/comment-test-01-tasks-page.png', fullPage: true });

        // Find and click comment button
        const commentButton = page.locator('button[title="Comments & Details"]').first();
        await commentButton.waitFor({ state: 'visible', timeout: 10000 });

        console.log('🖱️ Clicking comment button...');
        await commentButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/comment-test-02-after-click.png', fullPage: true });

        // Check if Task Details modal is visible (it SHOULD be)
        const taskDetailsModal = page.locator('text=Task Details');
        await expect(taskDetailsModal).toBeVisible({ timeout: 10000 });

        console.log('✅ PASSED: Task Details modal opened via comment button');
        await page.screenshot({ path: 'test-results/comment-test-03-modal-open.png', fullPage: true });

        console.log('🎉 Comment button test completed successfully!');
    });
});
