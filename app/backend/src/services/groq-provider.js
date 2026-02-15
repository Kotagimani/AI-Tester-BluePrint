import Groq from 'groq-sdk';
import { decrypt } from '../utils/encryption.js';
import db from '../database.js';

export async function generateWithGroq(prompt, systemPrompt) {
    const apiKeyRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('groq_api_key');
    const modelRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('groq_model');
    const tempRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('groq_temperature');

    if (!apiKeyRow) {
        throw new Error('Groq API key not configured. Please set it in Settings.');
    }

    const apiKey = decrypt(apiKeyRow.value);
    const model = modelRow?.value || 'llama3-70b-8192';
    const temperature = parseFloat(tempRow?.value || '0.3');

    const groq = new Groq({ apiKey });

    const startTime = Date.now();

    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        model,
        temperature,
        max_tokens: 8192,
    });

    const generationTime = Date.now() - startTime;

    return {
        content: completion.choices[0]?.message?.content || '',
        model,
        provider: 'groq',
        metadata: {
            tokensUsed: completion.usage?.total_tokens || 0,
            generationTimeMs: generationTime,
        },
    };
}

export async function testGroqConnection() {
    const apiKeyRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('groq_api_key');
    if (!apiKeyRow) return { connected: false, message: 'Groq API key not configured' };

    try {
        const apiKey = decrypt(apiKeyRow.value);
        const groq = new Groq({ apiKey });
        const models = await groq.models.list();
        return { connected: true, message: `Connected. ${models.data?.length || 0} models available.` };
    } catch (err) {
        return { connected: false, message: `Connection failed: ${err.message}` };
    }
}

export async function getGroqModels() {
    const apiKeyRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('groq_api_key');
    if (!apiKeyRow) return [];

    try {
        const apiKey = decrypt(apiKeyRow.value);
        const groq = new Groq({ apiKey });
        const models = await groq.models.list();
        return models.data || [];
    } catch (err) {
        console.error('Failed to fetch Groq models:', err);
        return [];
    }
}
