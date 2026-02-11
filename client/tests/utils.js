export async function loginUser(page, username, password) {
    if (!username || !password) {
        throw new Error('Username and password are required for login');
    }

    console.log(`🔐 Logging in as ${username}...`);
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    // Check if we are on the Landing Page (look for "Sign In" button)
    const signInButton = page.locator('button:has-text("Sign In")');

    // Also check for "Get Started" which might be another button on landing
    // Or check if we are already logged in (Dashboard check)
    // Use .first() to avoid strict mode violation if multiple elements match
    // Check if we are already logged in (look for Sidebar)
    // The previous check for 'text=Dashboard' was flaky on Landing Page
    if (await page.locator('.sidebar').isVisible()) {
        console.log('  ➜ Already logged in!');
        return;
    }

    if (await signInButton.isVisible()) {
        console.log('  ➜ Found Landing Page, clicking Sign In...');
        await signInButton.click();
        // Wait for navigation/animation to login form
        await page.waitForTimeout(500);
    } else {
        console.log('  ➜ Sign In button not found. Checking current state...');
        await page.screenshot({ path: `test-results/login-state-${username}.png`, fullPage: true });
    }

    // Wait for login form
    try {
        await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    } catch (e) {
        console.log('❌ Failed to find login form!');
        await page.screenshot({ path: `test-results/login-form-missing-${username}.png`, fullPage: true });
        // Check for Setup needed
        if (await page.locator('text=Complete Setup').isVisible()) {
            console.log('⚠️  System requires setup! (Seed data might be missing or DB clear)');
        }
        throw e;
    }

    // Fill credentials
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    // Submit
    await page.click('button[type="submit"]');

    // Handle Workspace Selection (if applicable for Owners)
    try {
        const selectWorkspaceHeader = page.locator('text=Select Workspace');
        // Wait briefly to see if it appears
        // Using Promise.race to not wait full 3s if Dashboard appears first
        await Promise.race([
            selectWorkspaceHeader.waitFor({ state: 'visible', timeout: 3000 }),
            page.waitForSelector('text=Dashboard', { timeout: 3000 })
        ]);

        if (await selectWorkspaceHeader.isVisible()) {
            console.log('  ➜ Workspace selection required. Selecting first workspace...');
            // Click the first workspace button
            const firstWorkspace = page.locator('div.glass-card > div > button').first();
            await firstWorkspace.click();
            await page.waitForTimeout(1000);
        }
    } catch (e) {
        // Ignore timeout - likely went straight to dashboard
    }

    // Wait for successful login (Dashboard or other specific element)
    // We wait for checking text "Dashboard" OR "Projects" OR "Tasks" just to be safe
    // preventing the test from proceeding before login completes
    try {
        await Promise.race([
            page.locator('text=Dashboard').first().waitFor({ state: 'visible', timeout: 10000 }),
            page.locator('text=Projects').first().waitFor({ state: 'visible', timeout: 10000 }), // Member might not see Dashboard
            page.locator('text=Tasks').first().waitFor({ state: 'visible', timeout: 10000 }),
            page.waitForURL('**/projects', { timeout: 10000 }),
            page.waitForURL('**/tasks', { timeout: 10000 })
        ]);
        console.log(`✅ Logged in as ${username}`);
    } catch (e) {
        console.log(`⚠️  Login verification timed out, but proceeding...`);
        // Take a screenshot if possible to debug
        await page.screenshot({ path: `test-results/login-timeout-${username}.png`, fullPage: true }).catch(() => { });
    }
}
