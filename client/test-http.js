// Simple HTTP-based test script as fallback
const http = require('http');

const testEndpoint = (path, description) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`✓ ${description}: Status ${res.statusCode}`);
                resolve({ success: res.statusCode === 200, status: res.statusCode, data });
            });
        });

        req.on('error', (error) => {
            console.log(`✗ ${description}: ${error.message}`);
            resolve({ success: false, error: error.message });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            console.log(`✗ ${description}: Timeout`);
            resolve({ success: false, error: 'Timeout' });
        });

        req.end();
    });
};

const runTests = async () => {
    console.log('\n=== HTTP Connectivity Tests ===\n');

    await testEndpoint('/', 'Homepage');
    await testEndpoint('/api/health', 'Health Check');

    console.log('\n=== Tests Complete ===\n');
};

runTests();
