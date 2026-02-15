import db from '../database.js';

export async function generateWithOllama(prompt, systemPrompt) {
    const baseUrlRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('ollama_base_url');
    const modelRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('ollama_model');

    const baseUrl = baseUrlRow?.value || 'http://localhost:11434';
    const model = modelRow?.value || 'llama3';

    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            stream: false,
            options: {
                temperature: 0.3,
                num_predict: 8192,
            },
        }),
        signal: AbortSignal.timeout(120000), // 120s timeout for Ollama
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const generationTime = Date.now() - startTime;

    return {
        content: data.message?.content || '',
        model,
        provider: 'ollama',
        metadata: {
            tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            generationTimeMs: generationTime,
        },
    };
}

export async function getOllamaModels() {
    const baseUrlRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('ollama_base_url');
    const baseUrl = baseUrlRow?.value || 'http://localhost:11434';

    try {
        const response = await fetch(`${baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return (data.models || []).map(m => ({ name: m.name, size: m.size }));
    } catch (err) {
        throw new Error(`Cannot reach Ollama at ${baseUrl}: ${err.message}`);
    }
}

export async function testOllamaConnection() {
    const baseUrlRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('ollama_base_url');
    const baseUrl = baseUrlRow?.value || 'http://localhost:11434';

    try {
        const response = await fetch(`${baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
            const data = await response.json();
            return { connected: true, message: `Connected. ${data.models?.length || 0} models available.` };
        }
        return { connected: false, message: `Ollama returned status ${response.status}` };
    } catch (err) {
        return { connected: false, message: `Cannot reach Ollama: ${err.message}` };
    }
}
