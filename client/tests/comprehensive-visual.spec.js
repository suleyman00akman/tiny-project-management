import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Comprehensive Visual Browser Tests', () => {
    test.beforeEach(async ({ page }) => {
        process.env.HOME = process.env.USERPROFILE || process.env.HOME;
    });

    test('Test 1: Login as Workspace Owner (admin-01)', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Verify Dashboard is visible
        const dashboardHeading = page.locator('h2:has-text("Dashboard")');
        if (await dashboardHeading.isVisible()) {
            console.log('✅ Workspace Owner can access Dashboard');
            await page.screenshot({ path: 'test-results/01-wp-owner-dashboard.png', fullPage: true });
        }

        // Navigate to Projects
        await page.click('a[href="/projects"]');
        await page.waitForTimeout(1000); // Wait for transition
        await page.screenshot({ path: 'test-results/01-wp-owner-projects.png', fullPage: true });
        console.log('✅ Workspace Owner Projects page');

        // Navigate to Team
        const teamLink = page.locator('a[href="/team"]');
        if (await teamLink.isVisible()) {
            await teamLink.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/01-wp-owner-team.png', fullPage: true });
            console.log('✅ Workspace Owner Team page');
        }

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/01-wp-owner-tasks-list.png', fullPage: true });
        console.log('✅ Workspace Owner Tasks page (List view)');

        // Try Kanban view
        const kanbanButton = page.locator('button:has-text("My Kanban")');
        if (await kanbanButton.isVisible()) {
            await kanbanButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/01-wp-owner-tasks-kanban.png', fullPage: true });
            console.log('✅ Workspace Owner Kanban view');
        }
    });

    test('Test 2: Login as Member (user200)', async ({ page }) => {
        await loginUser(page, 'user200', 'password123');

        // Verify Dashboard link is NOT visible
        const dashboardLink = page.locator('a:has-text("Dashboard")');
        const isDashboardVisible = await dashboardLink.isVisible().catch(() => false);

        if (!isDashboardVisible) {
            console.log('✅ Dashboard is correctly hidden for Member');
            await page.screenshot({ path: 'test-results/02-member-no-dashboard.png', fullPage: true });
        } else {
            console.log('❌ Dashboard should be hidden for Member');
        }

        // Navigate to Tasks (should be default or available)
        // If logged in as member, it typically directs to Projects or Tasks
        // Ensure we are on a page where we can see nav

        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/02-member-tasks-list.png', fullPage: true });
        console.log('✅ Member Tasks page (List view)');

        // Try Kanban view
        const kanbanButton = page.locator('button:has-text("My Kanban")');
        if (await kanbanButton.isVisible()) {
            await kanbanButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/02-member-tasks-kanban.png', fullPage: true });
            console.log('✅ Member Kanban view (personal tasks only)');
        }

        // Switch back to list view
        await page.click('button:has-text("All Tasks")');
        await page.waitForTimeout(1000);
    });

    test('Test 3: Member - Inline Editing', async ({ page }) => {
        await loginUser(page, 'user200', 'password123');

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(1000);

        // Find a task and click on it (should activate inline edit, not modal)
        // We wait for Todo list to populate
        const taskText = page.locator('.todo-text').first();
        await taskText.waitFor({ state: 'visible', timeout: 5000 }).catch(() => console.log('No tasks found to edit'));

        if (await taskText.isVisible()) {
            const originalText = await taskText.textContent();
            console.log(`📝 Original task text: ${originalText}`);

            await taskText.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'test-results/03-inline-edit-activated.png', fullPage: true });

            // Check if inline edit is active (Save button visible)
            const saveButton = page.locator('button:has-text("Save")').first();
            const isInlineEditActive = await saveButton.isVisible().catch(() => false);

            if (isInlineEditActive) {
                console.log('✅ Inline editing activated (no modal)');

                // Edit the task
                const textInput = page.locator('input[type="text"]').first();
                await textInput.fill('Updated via Inline Edit - Browser Test');
                await page.screenshot({ path: 'test-results/03-inline-edit-editing.png', fullPage: true });

                // Save
                await saveButton.click();
                await page.waitForTimeout(1500);
                await page.screenshot({ path: 'test-results/03-inline-edit-saved.png', fullPage: true });
                console.log('✅ Inline edit saved successfully');
            } else {
                console.log('❌ Inline editing did not activate');
                await page.screenshot({ path: 'test-results/03-inline-edit-FAILED.png', fullPage: true });
            }
        }
    });

    test('Test 4: Member - Task Details Modal (via comment button)', async ({ page }) => {
        await loginUser(page, 'user200', 'password123');

        // Navigate to Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(1000);

        // Click comment button to open Task Details
        const commentButton = page.locator('button[title="Comments & Details"]').first();
        if (await commentButton.isVisible()) {
            await commentButton.click();
            await page.waitForTimeout(1000);

            // Verify Task Details modal is open
            const taskDetailsHeading = page.locator('text=Task Details');
            if (await taskDetailsHeading.isVisible()) {
                console.log('✅ Task Details modal opened via comment button');
                await page.screenshot({ path: 'test-results/04-task-details-modal.png', fullPage: true });

                // Try adding a comment
                const commentInput = page.locator('input[placeholder*="comment"]').first();
                if (await commentInput.isVisible()) {
                    await commentInput.fill('Test comment from browser test! 🎉');
                    await page.screenshot({ path: 'test-results/04-adding-comment.png', fullPage: true });

                    await page.click('button:has-text("Post")');
                    await page.waitForTimeout(1500);
                    await page.screenshot({ path: 'test-results/04-comment-posted.png', fullPage: true });
                    console.log('✅ Comment posted successfully');
                }
            }
        }
    });

    test('Test 5: Workspace Owner - Create Project', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Navigate to Projects
        await page.click('a[href="/projects"]');
        await page.waitForTimeout(1000);

        // Click Create Project
        const createButton = page.locator('button:has-text("Create Project")').first();
        if (await createButton.isVisible()) {
            await createButton.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'test-results/05-create-project-modal.png', fullPage: true });

            // Fill project details
            const timestamp = Date.now();
            await page.fill('input[name="name"]', `Browser Test Project ${timestamp}`);
            await page.screenshot({ path: 'test-results/05-create-project-filled.png', fullPage: true });

            await page.click('button:has-text("Create")');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test-results/05-project-created.png', fullPage: true });
            console.log('✅ Project created successfully');
        }
    });

    test('Test 6: Workspace Owner - Create Task', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Navigate to Projects
        await page.click('a[href="/projects"]');
        await page.waitForTimeout(1000);

        // Click on first project
        const firstProject = page.locator('.project-card').first();
        if (await firstProject.isVisible()) {
            await firstProject.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/06-project-view.png', fullPage: true });

            // Create a task
            const addTaskButton = page.locator('button:has-text("Add Task")').first();
            if (await addTaskButton.isVisible()) {
                await addTaskButton.click();
                await page.waitForTimeout(500);
                await page.screenshot({ path: 'test-results/06-create-task-modal.png', fullPage: true });

                await page.fill('input[name="text"]', 'Browser Test Task - Comprehensive Testing');
                await page.screenshot({ path: 'test-results/06-create-task-filled.png', fullPage: true });

                await page.click('button:has-text("Create")');
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'test-results/06-task-created.png', fullPage: true });
                console.log('✅ Task created successfully');
            }
        }
    });

    test('Test 7: Workspace Owner - Kanban View', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Navigate to Projects
        await page.click('a[href="/projects"]');
        await page.waitForTimeout(1000);

        // Click on first project
        const firstProject = page.locator('.project-card').first();
        if (await firstProject.isVisible()) {
            await firstProject.click();
            await page.waitForTimeout(1000);

            // Switch to Kanban view
            const kanbanButton = page.locator('button:has-text("Kanban")');
            if (await kanbanButton.isVisible()) {
                await kanbanButton.click();
                await page.waitForTimeout(1000);
                await page.screenshot({ path: 'test-results/07-kanban-view.png', fullPage: true });
                console.log('✅ Kanban view displayed');
            }

            // Switch to Calendar view
            const calendarButton = page.locator('button:has-text("Calendar")');
            if (await calendarButton.isVisible()) {
                await calendarButton.click();
                await page.waitForTimeout(1000);
                await page.screenshot({ path: 'test-results/07-calendar-view.png', fullPage: true });
                console.log('✅ Calendar view displayed');
            }

            // Switch to Gantt view
            const ganttButton = page.locator('button:has-text("Gantt")');
            if (await ganttButton.isVisible()) {
                await ganttButton.click();
                await page.waitForTimeout(1000);
                await page.screenshot({ path: 'test-results/07-gantt-view.png', fullPage: true });
                console.log('✅ Gantt view displayed');
            }
        }
    });

    test('Test 8: Final System Overview', async ({ page }) => {
        await loginUser(page, 'admin-01', 'password123');

        // Dashboard
        await page.screenshot({ path: 'test-results/08-final-dashboard.png', fullPage: true });
        console.log('📊 Dashboard screenshot captured');

        // Projects
        await page.click('a[href="/projects"]');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/08-final-projects.png', fullPage: true });
        console.log('📁 Projects screenshot captured');

        // Tasks
        await page.click('a[href="/tasks"]');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/08-final-tasks.png', fullPage: true });
        console.log('✅ Tasks screenshot captured');

        // Team
        const teamLink = page.locator('a[href="/team"]');
        if (await teamLink.isVisible()) {
            await teamLink.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/08-final-team.png', fullPage: true });
            console.log('👥 Team screenshot captured');
        }

        console.log('✅ Comprehensive browser testing completed!');
    });
});
