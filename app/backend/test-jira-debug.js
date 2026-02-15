import db from './src/database.js';
import { decrypt, encrypt } from './src/utils/encryption.js';

// Define credentials explicitly again to test directly.
// If this works, the DB storage/encryption is the issue.
// If this fails, the token/url/permission is the issue.
const JIRA_URL = 'https://marujira.atlassian.net';
const JIRA_EMAIL = 'maruthi.kotagimani91@gmail.com';
const JIRA_TOKEN = 'YOUR_JIRA_TOKEN_HERE';

async function testConnection() {
    console.log('--- JIRA Connectivity Test ---');
    console.log(`URL: ${JIRA_URL}`);
    console.log(`User: ${JIRA_EMAIL}`);
    console.log(`Token Length: ${JIRA_TOKEN.length}`);

    // 1. Test direct fetch (mimic backend)
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
    const endpoint = `${JIRA_URL}/rest/api/3/myself`;

    console.log(`\nFetching: ${endpoint}`);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        console.log('Response Body:', text.substring(0, 500)); // Log first 500 chars

        if (response.ok) {
            console.log('\n✅ JIRA Connection SUCCESSFUL!');
            const data = JSON.parse(text);
            console.log(`Connected as: ${data.displayName} (${data.emailAddress})`);
        } else {
            console.log('\n❌ JIRA Connection FAILED.');
            if (response.status === 401) console.log('-> Authentication Error: Check API Token (ensure no extra spaces) and Email.');
            if (response.status === 403) console.log('-> Permission Error: User does not have access.');
            if (response.status === 404) console.log('-> Not Found: Check Base URL.');
        }

    } catch (error) {
        console.error('\n❌ Network/Fetch Error:', error.message);
    }
}

testConnection();
