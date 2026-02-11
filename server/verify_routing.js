const http = require('http');

const get = (path) => new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
});

const post = (path, body) => new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
});

const run = async () => {
    try {
        console.log("Checking System Status (Expect: true)...");
        let status = await get('/api/system/status');
        console.log("Status:", status);

        if (status.initialized) {
            console.log("System correctly reported as initialized. Persistence working!");
        } else {
            console.log("ERROR: System reported as NOT initialized! Persistence failed?");
        }

        // Verify Login to check workspaceName
        console.log("Verifying Login...");
        const login = await post('/api/login', { username: "router", password: "password123" });
        console.log("Login Result:", login);

        if (login.workspaceName === "Routing Test Corp") {
            console.log("SUCCESS: Workspace Name returned in login: " + login.workspaceName);
        } else {
            console.log("WARNING: Workspace Name missing or mismatch:", login.workspaceName);
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
};

run();
