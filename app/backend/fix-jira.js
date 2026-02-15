import db from './src/database.js';
import { encrypt, decrypt } from './src/utils/encryption.js';

const JIRA_URL = 'https://marujira.atlassian.net';
const JIRA_EMAIL = 'maruthi.kotagimani91@gmail.com';
const JIRA_TOKEN = 'YOUR_JIRA_TOKEN_HERE';

console.log('--- JIRA Fix: Setting Credentials ---');

try {
    const upsert = db.prepare(
        'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    );

    // Use the transaction wrapper for safety
    const performUpdate = db.transaction(() => {
        upsert.run('jira_base_url', JIRA_URL);
        upsert.run('jira_username', JIRA_EMAIL);
        upsert.run('jira_api_token', encrypt(JIRA_TOKEN));
    });

    performUpdate();
    console.log('✅ Update committed.');

    // Verification
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('jira_api_token');
    const decrypted = decrypt(row.value);

    if (decrypted === JIRA_TOKEN) {
        console.log('✅ Decryption Verified: SUCCESS');
    } else {
        console.error('❌ Decryption Failed: tokens do not match');
    }

} catch (err) {
    console.error('❌ Error:', err);
}
