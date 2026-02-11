const API_URL = 'http://localhost:8080/api';

async function runTest() {
    try {
        console.log("1. Login as Admin...");
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '123456' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const adminId = loginData.id;
        console.log("   Success. Admin ID:", adminId);

        console.log("\n2. Create User 'testpm' (Manager)...");
        try {
            const createRes = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': adminId.toString()
                },
                body: JSON.stringify({
                    username: 'testpm',
                    password: 'password',
                    role: 'Manager'
                })
            });

            if (createRes.ok) {
                const userData = await createRes.json();
                console.log("   Success. Created User ID:", userData.id);
            } else {
                const err = await createRes.json();
                console.error("   Failed to create user:", err);
            }
        } catch (e) {
            console.error("   Failed:", e.message);
        }

        console.log("\n3. Check Activity Log...");
        const logRes = await fetch(`${API_URL}/admin/activity`, {
            headers: { 'x-user-id': adminId.toString() }
        });

        if (logRes.ok) {
            const logs = await logRes.json();
            const found = logs.find(l => l.action === 'USER_CREATE' && l.description.includes('testpm'));
            if (found) {
                console.log("   Success. Log found:", found.description);
            } else {
                console.error("   Failed. Log not found. Recent logs:", logs.slice(0, 3));
            }
        } else {
            console.error("   Failed to fetch logs:", logRes.status);
        }

        console.log("\n4. Login as 'testpm'...");
        const pmLoginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'testpm', password: 'password' })
        });

        if (!pmLoginRes.ok) throw new Error("PM Login Failed");
        const pmData = await pmLoginRes.json();
        const pmId = pmData.id;
        console.log("   Success. PM ID:", pmId);

        console.log("\n5. Try Create User as 'testpm' (Should Fail)...");
        const failRes = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': pmId.toString()
            },
            body: JSON.stringify({
                username: 'failuser',
                password: 'password',
                role: 'Member'
            })
        });

        if (failRes.status === 403) {
            console.log("   Success. Blocked with 403.");
        } else {
            console.error("   FAILED: Operation status:", failRes.status);
        }

        console.log("\n6. Try Public Registration (Should Fail)...");
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'hacker', password: '123' })
        });

        if (regRes.status === 403) {
            console.log("   Success. Blocked with 403.");
        } else {
            console.error("   FAILED: Operation status:", regRes.status);
        }

    } catch (err) {
        console.error("Global Test Error:", err.message);
    }
}

runTest();
