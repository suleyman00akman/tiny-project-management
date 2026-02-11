// Native fetch is available in Node 18+. checkout node -v if fails.
// const fetch = require('node-fetch'); 

const API_URL = 'http://localhost:8080/api';

async function runTest() {
    try {
        console.log("1. Login as Admin...");
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '123456' })
        });

        if (!loginRes.ok) throw new Error("Admin login failed");
        const admin = await loginRes.json();
        console.log("   Success. Admin ID:", admin.id);

        console.log("2. Create New User via Admin API...");
        const createRes = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': admin.id
            },
            body: JSON.stringify({ username: 'test_edit_user', password: '123', role: 'Member' })
        });

        let userId;
        if (createRes.ok) {
            const newUser = await createRes.json();
            userId = newUser.id;
            console.log("   Success. Created User ID:", userId);
        } else {
            // Maybe it exists, try login to get ID
            console.log("   User might exist, trying login...");
            const uLogin = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'test_edit_user', password: '123' })
            });
            const newUser = await uLogin.json();
            userId = newUser.id;
            console.log("   Found User ID:", userId);
        }

        console.log("3. Edit User (Change Role to Manager)...");
        const editRes = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': admin.id
            },
            body: JSON.stringify({ role: 'Manager' })
        });

        if (!editRes.ok) {
            const err = await editRes.json();
            throw new Error(`Edit failed: ${err.message}`);
        }
        const updatedUser = await editRes.json();
        if (updatedUser.role === 'Manager') {
            console.log("   Success. Role updated to Manager.");
        } else {
            throw new Error("Role did not update");
        }

        console.log("4. Verify Fetch Users...");
        const listRes = await fetch(`${API_URL}/users`, {
            headers: { 'x-user-id': admin.id }
        });
        const users = await listRes.json();
        const found = users.find(u => u.id === userId);
        if (found && found.role === 'Manager') {
            console.log("   Success. verified in list.");
        } else {
            throw new Error("User not found or role incorrect in list");
        }

        console.log("\nAll Team Directory Tests Passed!");

    } catch (err) {
        console.error("\nTEST FAILED:", err.message);
    }
}

runTest();
