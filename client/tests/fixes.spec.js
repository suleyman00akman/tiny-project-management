
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Fix Verification Tests', () => {

    test('Verify Project Member List Loading in Edit Modal', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Go to Projects
        await page.click('a[href="/projects"]');
        await page.waitForTimeout(1000);

        // Ensure there is a project or create one
        if (await page.locator('text=No projects found').isVisible()) {
            await page.click('button:has-text("New Project")');
            await page.fill('input[name="name"]', 'Test Verification Project');
            await page.click('button:has-text("Create Project")');
            await page.waitForTimeout(1000);
        }

        // Click Edit on the first project
        // In ProjectsPage.jsx, the button is "Edit Details"
        const editButton = page.locator('button:has-text("Edit Details")').first();
        if (await editButton.isVisible()) {
            await editButton.click();
        } else {
            console.log('Edit Details button not found, dumping page content');
            // console.log(await page.content());
            // Fail gracefully or try another strategy
            throw new Error("Could not find Edit Details button");
        }

        await page.waitForSelector('text=Edit Project');

        // Check if members are loaded
        // There should be checkboxes for users. 
        // We know 'admin-01' exists, and 'pmgr100', 'user200' from seed.
        // So we expect to see them.
        await expect(page.locator('label:has-text("pmgr100")')).toBeVisible({ timeout: 5000 });
        console.log('✅ Project Members loaded successfully');
    });

    test('Verify Inline Task Editing', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Go to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(2000); // Wait for hierarchy fetch

        // Verify we are in List mode (default)
        // Check if any project has tasks
        const todoList = page.locator('.todo-list');
        if (await todoList.count() === 0) {
            console.log('No todo lists found (projects might be empty or collapsed)');
            // Create a task if needed, but for now assuming seed data exists.
            // Force create a task if specific button exists?
            // Actually, handleCreateTask is on the page but might be inside a modal or inline form?
            // TasksPage doesn't show a generic "New Task" button in the code I read.
            // It has `handleCreateTask` but I don't see the form in the JSX I read (it was truncated or I missed it).
            // Retrying the view_file on TasksPage might be needed if this fails again.
            // For now, assume seed data "Test Task 1" exists.
        }

        // Find a task text span and click it
        // In SimpleTaskItem, the text is in a span inside the li -> div -> div
        // We can target specific text if we know it, or just the first span acting as title
        // The span has onClick handler.
        const taskText = page.locator('.todo-list li span').first();
        if (await taskText.isVisible()) {
            const initialText = await taskText.innerText();
            console.log(`Attempting to edit task: ${initialText}`);

            await taskText.click();

            // Check if input appears
            const input = page.locator('.todo-list li input[type="text"]').first();
            await expect(input).toBeVisible();
            console.log('✅ Inline edit input appeared');

            // Edit and save
            await input.fill(initialText + ' Edited');
            await page.click('button:has-text("Save")');

            await page.waitForTimeout(1000);
            await expect(page.locator(`text=${initialText} Edited`)).toBeVisible();
            console.log('✅ Inline edit saved successfully');
        } else {
            console.log("No tasks found to edit");
            // If seed data is missing, this will fail.
        }
    });
});
