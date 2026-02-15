const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
        ...options,
    });
    const data = await res.json();
    if (!res.ok && !data.success) {
        throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
}

// ===== Settings =====
export const settingsApi = {
    getAll: () => request('/settings'),

    saveJira: (data: { baseUrl: string; username: string; apiToken: string }) =>
        request('/settings/jira', { method: 'POST', body: JSON.stringify(data) }),

    testJira: () => request('/settings/jira/test'),

    saveLlm: (data: {
        provider?: string;
        groqApiKey?: string;
        groqModel?: string;
        groqTemperature?: number;
        ollamaBaseUrl?: string;
        ollamaModel?: string;
    }) => request('/settings/llm', { method: 'POST', body: JSON.stringify(data) }),

    testGroq: () => request('/settings/llm/test/groq'),
    getGroqModels: () => request('/settings/llm/models/groq'),
    testOllama: () => request('/settings/llm/test/ollama'),
};

// ===== JIRA =====
export const jiraApi = {
    fetch: (ticketId: string) =>
        request('/jira/fetch', { method: 'POST', body: JSON.stringify({ ticketId }) }),

    getRecent: () => request('/jira/recent'),
};

// ===== Test Plans =====
export const testPlanApi = {
    generate: (data: { ticketId: string; templateId?: number; provider?: string }) =>
        request('/testplan/generate', { method: 'POST', body: JSON.stringify(data) }),

    getHistory: () => request('/testplan/history'),

    getById: (id: number) => request(`/testplan/${id}`),

    getOllamaModels: () => request('/testplan/models/ollama'),
};

// ===== Templates =====
export const templatesApi = {
    getAll: () => request('/templates'),

    getById: (id: number) => request(`/templates/${id}`),

    upload: async (file: File, name?: string) => {
        const formData = new FormData();
        formData.append('template', file);
        if (name) formData.append('name', name);

        const res = await fetch(`${API_BASE}/templates/upload`, {
            method: 'POST',
            body: formData,
        });
        return res.json();
    },

    delete: (id: number) => request(`/templates/${id}`, { method: 'DELETE' }),
};
