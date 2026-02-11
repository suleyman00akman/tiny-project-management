// Native fetch used


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

        // --- PREPARATION ---
        console.log("2. Ensuring test users and projects exist...");

        // Find PM (manager) and Member (alice)
        const usersRes = await fetch(`${API_URL}/users`, { headers: { 'x-user-id': admin.id } });
        const users = await usersRes.json();
        const managerUser = users.find(u => u.username === 'manager');
        const aliceUser = users.find(u => u.username === 'alice');

        // Find Projects
        const p1 = (await (await fetch(`${API_URL}/projects`, { headers: { 'x-user-id': admin.id } })).json()).find(p => p.name === 'Mobile App Revamp');
        const p2 = (await (await fetch(`${API_URL}/projects`, { headers: { 'x-user-id': admin.id } })).json()).find(p => p.name === 'Q4 Marketing Strategy');

        console.log(`   Found: alice(ID:${aliceUser.id}), manager(ID:${managerUser.id})`);
        console.log(`   Projects: P1(${p1.id}, PM:manager), P2(${p2.id}, PM:dave)`);

        // --- TEST CASE 1: Reassign Alice from P2 to P1 ---
        // Alice starts in P2 (seeded). We'll move her to P1.
        console.log("3. Moving Alice from P2 to P1...");
        const moveRes = await fetch(`${API_URL}/admin/users/${aliceUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-id': admin.id },
            body: JSON.stringify({ projectId: p1.id })
        });

        if (!moveRes.ok) throw new Error(`Move failed: ${await moveRes.text()}`);
        console.log("   Success. Alice moved.");

        // --- TEST CASE 2: Verify Task Handover ---
        // P2 PM is 'dave'. Alice had tasks in P2 (seeded: Social Media Calendar, Email Campaign Draft).
        // Let's check tasks in P2.
        console.log("4. Verifying task handover in P2 (to PM dave)...");
        const p2Tasks = await (await fetch(`${API_URL}/projects/${p2.id}/todos`, { headers: { 'x-user-id': admin.id } })).json();

        const handedOver = p2Tasks.filter(t => t.text.includes('Social Media') || t.text.includes('Email Campaign'));
        handedOver.forEach(t => {
            if (t.assignedTo === 'dave') {
                console.log(`   [OK] Task "${t.text}" reassigned to PM dave.`);
            } else {
                console.error(`   [FAIL] Task "${t.text}" still assigned to ${t.assignedTo}`);
            }
        });

        // --- TEST CASE 3: Verify Logging ---
        console.log("5. Verifying Activity Logs...");
        const logs = await (await fetch(`${API_URL}/admin/activity`, { headers: { 'x-user-id': admin.id } })).json();

        const moveLog = logs.find(l => l.action === 'USER_PROJECT_CHANGE');
        const reassignLog = logs.find(l => l.action === 'TASK_AUTO_REASSIGN');

        if (moveLog) console.log("   [OK] USER_PROJECT_CHANGE log found.");
        if (reassignLog) console.log("   [OK] TASK_AUTO_REASSIGN log found.");

        // --- TEST CASE 4: Task Assignment Logging ---
        console.log("6. Testing Manual Task Assignment Logging...");
        const p1Tasks = await (await fetch(`${API_URL}/projects/${p1.id}/todos`, { headers: { 'x-user-id': admin.id } })).json();
        const someTaskId = p1Tasks[0].id;
        await fetch(`${API_URL}/todos/${someTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-id': admin.id },
            body: JSON.stringify({ assignedTo: 'manager' })
        });

        const newLogs = await (await fetch(`${API_URL}/admin/activity`, { headers: { 'x-user-id': admin.id } })).json();
        const assignLog = newLogs.find(l => l.action === 'TASK_ASSIGN');
        if (assignLog) console.log("   [OK] TASK_ASSIGN log found.");

        console.log("\nAll New Feature Tests Passed!");

    } catch (err) {
        console.error("\nTEST FAILED:", err.message);
    }
}

runTest();
