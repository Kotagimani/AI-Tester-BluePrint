import { Router } from 'express';
import db from '../database.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { validateUrl } from '../utils/validators.js';
import { testConnection } from '../services/jira-client.js';
import { testGroqConnection, getGroqModels } from '../services/groq-provider.js';
import { testOllamaConnection } from '../services/ollama-provider.js';

const router = Router();

// Get all settings (masks sensitive values)
router.get('/', (req, res) => {
    try {
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const settings = {};
        for (const row of rows) {
            if (row.key.includes('token') || row.key.includes('api_key')) {
                settings[row.key] = row.value ? '••••••••' : '';
            } else {
                settings[row.key] = row.value;
            }
        }
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Save JIRA settings
router.post('/jira', (req, res) => {
    try {
        const { baseUrl, username, apiToken } = req.body;

        if (baseUrl && !validateUrl(baseUrl)) {
            return res.status(400).json({ success: false, error: 'Invalid JIRA URL' });
        }

        const upsert = db.prepare(
            'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
        );

        const transaction = db.transaction(() => {
            if (baseUrl !== undefined) upsert.run('jira_base_url', baseUrl.replace(/\/+$/, ''));
            if (username !== undefined) upsert.run('jira_username', username);
            if (apiToken !== undefined) upsert.run('jira_api_token', encrypt(apiToken));
        });

        transaction();
        res.json({ success: true, message: 'JIRA settings saved' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Test JIRA connection
router.get('/jira/test', async (req, res) => {
    try {
        const result = await testConnection();
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, connected: false, message: err.message });
    }
});

// Save LLM settings
router.post('/llm', (req, res) => {
    try {
        const { provider, groqApiKey, groqModel, groqTemperature, ollamaBaseUrl, ollamaModel } = req.body;

        const upsert = db.prepare(
            'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
        );

        const transaction = db.transaction(() => {
            if (provider !== undefined) upsert.run('llm_provider', provider);
            if (groqApiKey !== undefined) upsert.run('groq_api_key', encrypt(groqApiKey));
            if (groqModel !== undefined) upsert.run('groq_model', groqModel);
            if (groqTemperature !== undefined) upsert.run('groq_temperature', String(groqTemperature));
            if (ollamaBaseUrl !== undefined) upsert.run('ollama_base_url', ollamaBaseUrl);
            if (ollamaModel !== undefined) upsert.run('ollama_model', ollamaModel);
        });

        transaction();
        res.json({ success: true, message: 'LLM settings saved' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Groq models
router.get('/llm/models/groq', async (req, res) => {
    try {
        const models = await getGroqModels();
        res.json({ success: true, models });
    } catch (err) {
        res.json({ success: false, models: [], error: err.message });
    }
});

// Test LLM connections
router.get('/llm/test/groq', async (req, res) => {
    try {
        const result = await testGroqConnection();
        res.json({ success: true, ...result });
    } catch (err) {
        res.json({ success: false, connected: false, message: err.message });
    }
});

router.get('/llm/test/ollama', async (req, res) => {
    try {
        const result = await testOllamaConnection();
        res.json({ success: true, ...result });
    } catch (err) {
        res.json({ success: false, connected: false, message: err.message });
    }
});

export default router;
