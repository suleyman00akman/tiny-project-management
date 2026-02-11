const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log("--- Starting SaaS Multi-Tenancy Verification ---");

    try {
        // 1. Register Workspace Alpha
        console.log("\n1. Registering Alpha Corp...");
        const regAlpha = await axios.post(`${API_URL}/register`, {
            username: 'alpha_mgr',
            password: 'password123',
            workspaceName: 'Alpha Corp'
        });
        const alphaId = regAlpha.data.userId;
        const alphaWsId = regAlpha.data.workspaceId;
        console.log(`   Success: alpha_mgr created in workspace ${alphaWsId}`);

        // 2. Login Alpha
        console.log("2. Logging in as alpha_mgr...");
        const loginAlpha = await axios.post(`${API_URL}/login`, {
            username: 'alpha_mgr',
            password: 'password123'
        });
        const alphaToken = loginAlpha.data.id;

        // 3. Create Project in Alpha
        console.log("3. Creating project in Alpha...");
        const projAlpha = await axios.post(`${API_URL}/projects`,
            { name: 'Alpha Secret Plan' },
            { headers: { 'x-user-id': alphaToken } }
        );
        const alphaProjId = projAlpha.data.id;
        console.log(`   Project Created: ${projAlpha.data.name} (ID: ${alphaProjId})`);

        // 4. Register Workspace Beta
        console.log("\n4. Registering Beta Ltd...");
        const regBeta = await axios.post(`${API_URL}/register`, {
            username: 'beta_mgr',
            password: 'password123',
            workspaceName: 'Beta Ltd'
        });
        const betaToken = regBeta.data.userId;
        const betaWsId = regBeta.data.workspaceId;
        console.log(`   Success: beta_mgr created in workspace ${betaWsId}`);

        // 5. Try to access Alpha Project with Beta User (Cross-Tenant check)
        console.log("5. Testing Data Isolation (Beta user accessing Alpha project)...");
        try {
            await axios.get(`${API_URL}/projects/${alphaProjId}`, {
                headers: { 'x-user-id': betaToken }
            });
            console.error("   FAILURE: Beta user could access Alpha project!");
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.log("   SUCCESS: Access Denied as expected (403).");
            } else {
                console.error(`   ERROR: Unexpected error ${err.message}`);
            }
        }

        // 6. Verify Beta sees empty projects
        console.log("6. Verifying Beta project list...");
        const betaProjs = await axios.get(`${API_URL}/projects`, {
            headers: { 'x-user-id': betaToken }
        });
        if (betaProjs.data.length === 0) {
            console.log("   SUCCESS: Beta project list is empty.");
        } else {
            console.error(`   FAILURE: Beta user sees ${betaProjs.data.length} projects!`);
        }

        console.log("\n--- SaaS Verification Complete ---");

    } catch (err) {
        console.error("\nTest Failed with Error:");
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error(`Data:`, err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

runTest();
