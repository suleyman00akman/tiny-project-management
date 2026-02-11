
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Robust Fix Verification Tests', () => {

    test('Verify Project Member List Loading in Edit Modal', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Setup: Ensure a project exists using API
        await page.evaluate(async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch('/api/projects', {
                headers: { 'x-user-id': user.id }
            });
            const projects = await res.json();
            if (projects.length === 0) {
                await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                    body: JSON.stringify({ name: 'API Created Project' })
                });
            }
        });

        // Go to Projects
        await page.goto('http://localhost:8080/projects');
        await page.waitForLoadState('networkidle');

        // Click Edit on the first project
        const editButton = page.locator('button:has-text("Edit Details")').first();
        await expect(editButton).toBeVisible({ timeout: 10000 });
        await editButton.click();

        await page.waitForSelector('text=Edit Project', { timeout: 10000 });

        // Check if members are loaded (pmgr100 should be visible)
        await expect(page.locator('label:has-text("pmgr100")')).toBeVisible({ timeout: 5000 });
        console.log('✅ Project Members loaded successfully');
    });

    test('Verify Inline Task Editing', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Setup: Ensure a project and task exists using API
        await page.evaluate(async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            // Get projects
            let res = await fetch('/api/projects', { headers: { 'x-user-id': user.id } });
            let projects = await res.json();
            let projectId;
            if (projects.length === 0) {
                const pRes = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                    body: JSON.stringify({ name: 'API Task Project' })
                });
                const pData = await pRes.json();
                projectId = pData.workspace ? pData.workspace.id : (await pRes.json()).workspace?.id;
                // Wait backend response structure might vary, let's just fetch again
                res = await fetch('/api/projects', { headers: { 'x-user-id': user.id } });
                projects = await res.json();
                projectId = projects[0].id;
            } else {
                projectId = projects[0].id;
            }

            // Check tasks
            const tRes = await fetch(`/api/projects/${projectId}/todos`, { headers: { 'x-user-id': user.id } });
            const todos = await tRes.json();
            if (todos.length === 0) {
                await fetch(`/api/projects/${projectId}/todos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                    body: JSON.stringify({ text: 'API Verification Task' })
                });
            }
        });

        // Go to Tasks
        await page.goto('http://localhost:8080/tasks');
        await page.waitForLoadState('networkidle');

        // Wait for task list
        await expect(page.locator('.todo-list li')).not.toHaveCount(0, { timeout: 10000 });

        // Find a task text span and click it
        const taskText = page.locator('.todo-list li span').first();
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

        await page.waitForTimeout(500);
        await expect(page.locator(`text=${initialText} Edited`)).toBeVisible();
        console.log('✅ Inline edit saved successfully');
    });
});
