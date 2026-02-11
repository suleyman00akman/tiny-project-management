const http = require('http');

const data = JSON.stringify({
    orgName: "AutoTest Org",
    adminUsername: "autoadmin",
    adminEmail: "auto@admin.com",
    adminPassword: "password123",
    deptName: "AutoDept",
    members: [
        { email: "member1@test.com", role: "Member" },
        { email: "pm1@test.com", role: "Project Manager" }
    ]
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register-org',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
