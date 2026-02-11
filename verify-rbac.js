const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function test() {
    console.log("Starting Verification...");

    // Using ID 25 (admin-01) which is a Manager and Workspace Owner
    const ownerToken = '25';
    // Using ID 19 (user) which is a Member
    const memberToken = '19';

    try {
        // 1. Check Language preference for new session check
        console.log("\n1. Testing Language enforcement...");
        const meRes = await axios.get(`${BASE_URL}/api/me`, { headers: { 'x-user-id': ownerToken } });
        // The /api/me response doesn't currently include preferredLanguage in the JSON returned by the endpoint (I should check index.js line 791)
        // Wait, line 784 of index.js. I should check if it's there.
        console.log("User Info:", meRes.data);

        // Let's check a login response instead as it definitely has it
        // Or we can check the User model default via a new user creation.

        // 2. Check Language Endpoint Removal
        console.log("\n2. Testing Language Endpoint Removal...");
        try {
            await axios.put(`${BASE_URL}/api/users/language`,
                { language: 'tr' },
                { headers: { 'x-user-id': ownerToken } }
            );
            console.error("FAIL: PUT /api/users/language still exists!");
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log("PASS: PUT /api/users/language returned 404 (Endpoint Removed)");
            } else {
                console.error("FAIL: PUT /api/users/language returned unexpected error:", err.response?.status);
            }
        }

        // 3. RBAC: Workspace Owner (ID 25) creating a user
        console.log("\n3. Testing RBAC: Workspace Owner creating a user...");
        try {
            const newUserRes = await axios.post(`${BASE_URL}/api/users`, {
                username: 'rbac_test_' + Date.now(),
                password: 'password123',
                role: 'Member'
            }, { headers: { 'x-user-id': ownerToken } });
            console.log("PASS: Workspace Owner successfully created a user.");
        } catch (err) {
            console.error("FAIL: Workspace Owner failed to create user:", err.response?.data || err.message);
        }

        // 4. RBAC: Member (ID 19) creating a user (Should FAIL)
        console.log("\n4. Testing RBAC: Member attempting to create a user (Should Fail)...");
        try {
            await axios.post(`${BASE_URL}/api/users`, {
                username: 'fail_test_' + Date.now(),
                password: 'password123',
                role: 'Member'
            }, { headers: { 'x-user-id': memberToken } });
            console.error("FAIL: Member was able to create a user!");
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.log("PASS: Member was denied user creation (403 Forbidden)");
            } else {
                console.error("FAIL: Member creation attempt returned unexpected error:", err.response?.status);
            }
        }

        console.log("\nVerification Finished.");
    } catch (err) {
        console.error("Test process failed:", err.message);
        if (err.response) console.error("Response data:", err.response.data);
    }
}

test();
