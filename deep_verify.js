const axios = require('axios');

const API_BASE = "http://localhost:3000";

async function runTest() {
    try {
        console.log("--- 1. REGISTERING WORKSPACE ---");
        const regRes = await axios.post(`${API_BASE}/api/register`, {
            username: "tester_" + Date.now(),
            password: "password123",
            workspaceName: "TestWS_" + Date.now()
        });
        const { userId, workspaceId } = regRes.data;
        console.log(`Registered User: ${regRes.config.data}`);
        console.log(`Response:`, regRes.data);

        console.log("\n--- 2. LOGGING IN ---");
        const loginPayload = JSON.parse(regRes.config.data);
        const loginRes = await axios.post(`${API_BASE}/api/login`, {
            username: loginPayload.username,
            password: loginPayload.password,
            workspaceName: loginPayload.workspaceName
        });
        const user = loginRes.data;
        console.log("Logged in as:", user.username);

        const authHeaders = { 'x-user-id': user.id };

        console.log("\n--- 3. CREATING INITIAL PROJECT ---");
        const projRes = await axios.post(`${API_BASE}/api/projects`, {
            name: "Automation Project",
            startDate: "2023-01-01",
            endDate: "2023-12-31",
            members: [] // Manager is added automatically
        }, { headers: authHeaders });
        const project = projRes.data;
        console.log("Created Project:", project.name, "ID:", project.id);
        console.log("Dates:", project.startDate, "to", project.endDate);

        console.log("\n--- 4. CREATING TASK IN PROJECT ---");
        const taskRes = await axios.post(`${API_BASE}/api/projects/${project.id}/todos`, {
            text: "Initial Task",
            startDate: "2023-01-01",
            dueDate: "2023-01-15",
            assignedTo: user.username
        }, { headers: authHeaders });
        const task = taskRes.data;
        console.log("Created Task:", task.text, "ID:", task.id);
        console.log("Task Dates:", task.startDate, "to", task.dueDate);
        console.log("Assigned To:", task.assignedTo);

        console.log("\n--- 5. VERIFYING LISTING ---");
        const listRes = await axios.get(`${API_BASE}/api/projects`, { headers: authHeaders });
        const found = listRes.data.find(p => p.id === project.id);
        if (found) {
            console.log("SUCCESS: Project found in listing.");
        } else {
            throw new Error("FAILED: Project NOT found in listing.");
        }

        const taskListRes = await axios.get(`${API_BASE}/api/projects/${project.id}/todos`, { headers: authHeaders });
        const taskFound = taskListRes.data.find(t => t.id === task.id);
        if (taskFound) {
            console.log("SUCCESS: Task found in project todos.");
        } else {
            throw new Error("FAILED: Task NOT found in project todos.");
        }

        console.log("\n--- GLOBAL SYSTEM TEST PASSED ---");
    } catch (err) {
        console.error("\n!!! TEST FAILED !!!");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        } else {
            console.error("Error:", err.message);
        }
        process.exit(1);
    }
}

runTest();
