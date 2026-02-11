const http = require('http');

const post = (path, data) => {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
};

async function runTests() {
    console.log("--- Starting SaaS Multi-Tenant Verification ---");

    try {
        // 1. Setup
        console.log("1. Initializing System...");
        const setupRes = await post('/api/setup', {
            workspaceName: "System",
            username: "sysadmin",
            password: "password123"
        });
        console.log("Setup Status:", setupRes.status, setupRes.body.message);

        // 2. Register Workspace A with User 'admin'
        console.log("\n2. Registering Alpha Corp with user 'admin'...");
        const regARes = await post('/api/register', {
            workspaceName: "Alpha Corp",
            username: "admin",
            password: "alpha-password"
        });
        console.log("Alpha Registration:", regARes.status, regARes.body.message);

        // 3. Register Workspace B with User 'admin'
        console.log("\n3. Registering Beta Ltd with user 'admin' (DUPLICATE USERNAME TEST)...");
        const regBRes = await post('/api/register', {
            workspaceName: "Beta Ltd",
            username: "admin",
            password: "beta-password"
        });
        console.log("Beta Registration:", regBRes.status, regBRes.body.message);

        if (regBRes.status === 201) {
            console.log("\nSUCCESS: Multi-tenant duplicate username 'admin' allowed in different workspaces!");
        } else {
            console.log("\nFAILURE: Multi-tenant duplicate username check failed.");
        }

        // 4. Test Login Disambiguation
        console.log("\n4. Testing Login Disambiguation...");

        // Login A
        const loginARes = await post('/api/login', {
            username: "admin",
            password: "alpha-password",
            workspaceName: "Alpha Corp"
        });
        console.log("Login Alpha:", loginARes.status, loginARes.body.workspaceName === "Alpha Corp" ? "MATCH" : "MISMATCH");

        // Login B
        const loginBRes = await post('/api/login', {
            username: "admin",
            password: "beta-password",
            workspaceName: "Beta Ltd"
        });
        console.log("Login Beta:", loginBRes.status, loginBRes.body.workspaceName === "Beta Ltd" ? "MATCH" : "MISMATCH");

        // Test Ambiguous Login (Should Fail and ask for workspace)
        const loginAmRes = await post('/api/login', {
            username: "admin",
            password: "alpha-password"
        });
        console.log("Ambiguous Login (No Workspace):", loginAmRes.status, loginAmRes.body.message);

    } catch (err) {
        console.error("Test execution failed:", err);
    }
}

runTests();
