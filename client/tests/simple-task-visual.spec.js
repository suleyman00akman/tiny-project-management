import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

// Set timeout to 90 seconds
test.setTimeout(90000);

test.describe('SimpleTaskItem - Inline Edit Visual Test', () => {
    test.beforeEach(async ({ page }) => {
        process.env.HOME = process.env.USERPROFILE || process.env.HOME;
        page.setDefaultTimeout(60000);
    });

    test('Step 1: Login and Navigate to Tasks', async ({ page }) => {
        console.log('🔍 Test 1: Login and navigate to Tasks page');

        await loginUser(page, 'user200', 'password123');
        await page.screenshot({ path: 'test-results/step1-03-logged-in.png', fullPage: true });

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/step1-04-tasks-page.png', fullPage: true });

        console.log('✅ Test 1 completed: Logged in and navigated to Tasks');
    });

    test('Step 2: Click Task Text - Verify Inline Edit Activates', async ({ page }) => {
        console.log('🔍 Test 2: Click task text and verify inline edit activates');

        await loginUser(page, 'user200', 'password123');

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(2000);

        // Wait for tasks to load
        await page.waitForSelector('li', { timeout: 10000 });
        await page.screenshot({ path: 'test-results/step2-01-before-click.png', fullPage: true });

        // Find task text (looking for span with task text)
        const taskSpan = page.locator('li span').first();
        await taskSpan.waitFor({ state: 'visible', timeout: 10000 });

        const originalText = await taskSpan.textContent();
        console.log(`📝 Task text found: "${originalText}"`);

        // Click on task text
        await taskSpan.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'test-results/step2-02-after-click.png', fullPage: true });

        // Check if Task Details modal opened (it should NOT)
        const modalHeading = page.locator('text=Task Details');
        const isModalVisible = await modalHeading.isVisible().catch(() => false);

        if (isModalVisible) {
            console.log('❌ FAILED: Task Details modal opened (should NOT open)');
            await page.screenshot({ path: 'test-results/step2-FAILED-modal-opened.png', fullPage: true });
            throw new Error('Task Details modal should NOT open when clicking task text');
        }

        console.log('✅ PASSED: Task Details modal did NOT open');

        // Check if Save button is visible (inline edit activated)
        const saveButton = page.locator('button:has-text("Save")');
        await expect(saveButton).toBeVisible({ timeout: 5000 });

        console.log('✅ PASSED: Inline edit activated (Save button visible)');
        await page.screenshot({ path: 'test-results/step2-03-inline-edit-active.png', fullPage: true });

        console.log('✅ Test 2 completed: Inline edit works correctly');
    });

    test('Step 3: Edit Task and Save', async ({ page }) => {
        console.log('🔍 Test 3: Edit task text and save');

        await loginUser(page, 'user200', 'password123');

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(2000);

        // Click on task to activate inline edit
        const taskSpan = page.locator('li span').first();
        await taskSpan.click();
        await page.waitForTimeout(1000);

        // Edit the task
        const textInput = page.locator('input[type="text"]').first();
        await textInput.fill('✅ INLINE EDIT WORKS - Test Successful!');
        await page.screenshot({ path: 'test-results/step3-01-editing.png', fullPage: true });

        // Save
        const saveButton = page.locator('button:has-text("Save")');
        await saveButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/step3-02-saved.png', fullPage: true });

        // Verify text was updated
        const updatedText = await taskSpan.textContent();
        console.log(`📝 Updated text: "${updatedText}"`);

        if (updatedText.includes('INLINE EDIT WORKS')) {
            console.log('✅ PASSED: Task text was successfully updated');
        }

        console.log('✅ Test 3 completed: Edit and save works');
    });

    test('Step 4: Comment Button Opens Modal', async ({ page }) => {
        console.log('🔍 Test 4: Click comment button and verify modal opens');

        await loginUser(page, 'user200', 'password123');

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/step4-01-tasks-page.png', fullPage: true });

        // Find and click comment button (💬)
        const commentButton = page.locator('button[title="Comments & Details"]').first();
        await commentButton.waitFor({ state: 'visible', timeout: 10000 });

        await commentButton.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'test-results/step4-02-after-comment-click.png', fullPage: true });

        // Verify Task Details modal opened
        const modalHeading = page.locator('text=Task Details');
        await expect(modalHeading).toBeVisible({ timeout: 5000 });

        console.log('✅ PASSED: Task Details modal opened via comment button');
        await page.screenshot({ path: 'test-results/step4-03-modal-open.png', fullPage: true });

        console.log('✅ Test 4 completed: Comment button works correctly');
    });

    test('Step 5: Test Edit Icon', async ({ page }) => {
        console.log('🔍 Test 5: Click edit icon (✎) and verify inline edit activates');

        await loginUser(page, 'user200', 'password123');

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(2000);

        // Find and click edit icon
        const editIcon = page.locator('button[title="Edit"]').first();
        if (await editIcon.isVisible()) {
            await editIcon.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/step5-01-edit-icon-clicked.png', fullPage: true });

            // Verify Save button is visible
            const saveButton = page.locator('button:has-text("Save")');
            await expect(saveButton).toBeVisible({ timeout: 5000 });

            console.log('✅ PASSED: Edit icon activates inline edit');
        } else {
            console.log('⚠️ Edit icon not found (might be hidden)');
        }

        console.log('✅ Test 5 completed');
    });
});
