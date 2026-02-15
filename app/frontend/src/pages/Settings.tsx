import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Globe, Brain, FileUp, Loader2, CheckCircle2, XCircle, Upload, Trash2 } from 'lucide-react';
import { settingsApi, templatesApi } from '../services/api';

interface SettingsProps {
    showToast: (type: 'success' | 'error', message: string) => void;
}

interface Template {
    id: number;
    name: string;
    filename: string;
    created_at: string;
}

export default function Settings({ showToast }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<'jira' | 'llm' | 'templates'>('jira');

    // JIRA settings
    const [jiraUrl, setJiraUrl] = useState('');
    const [jiraUsername, setJiraUsername] = useState('');
    const [jiraToken, setJiraToken] = useState('');
    const [jiraStatus, setJiraStatus] = useState<{ connected: boolean; message: string } | null>(null);
    const [jiraTesting, setJiraTesting] = useState(false);
    const [jiraSaving, setJiraSaving] = useState(false);

    // LLM settings
    const [llmProvider, setLlmProvider] = useState('groq');
    const [groqKey, setGroqKey] = useState('');
    const [groqModel, setGroqModel] = useState('llama3-70b-8192');
    const [groqTemp, setGroqTemp] = useState(0.3);
    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
    const [ollamaModel, setOllamaModel] = useState('');
    const [groqStatus, setGroqStatus] = useState<{ connected: boolean; message: string } | null>(null);
    const [ollamaStatus, setOllamaStatus] = useState<{ connected: boolean; message: string } | null>(null);
    const [llmSaving, setLlmSaving] = useState(false);
    const [groqModels, setGroqModels] = useState<any[]>([]);

    // Templates
    const [templates, setTemplates] = useState<Template[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        // Load current settings
        settingsApi.getAll().then(res => {
            if (res.success && res.settings) {
                const s = res.settings;
                if (s.jira_base_url) setJiraUrl(s.jira_base_url);
                if (s.jira_username) setJiraUsername(s.jira_username);
                if (s.llm_provider) setLlmProvider(s.llm_provider);
                if (s.groq_model) setGroqModel(s.groq_model);
                if (s.groq_temperature) setGroqTemp(parseFloat(s.groq_temperature));
                if (s.ollama_base_url) setOllamaUrl(s.ollama_base_url);
                if (s.ollama_model) setOllamaModel(s.ollama_model);

                // If Groq is configured, fetch models
                if (s.groq_api_key || s.llm_provider === 'groq') {
                    fetchGroqModels();
                }
            }
        }).catch(() => { });

        loadTemplates();
    }, []);

    const fetchGroqModels = async () => {
        try {
            const res = await settingsApi.getGroqModels();
            if (res.success && Array.isArray(res.models)) {
                setGroqModels(res.models);
            }
        } catch (error) {
            console.error('Failed to fetch Groq models:', error);
        }
    };

    const loadTemplates = () => {
        templatesApi.getAll().then(res => {
            if (res.success) setTemplates(res.templates || []);
        }).catch(() => { });
    };

    const handleSaveJira = async () => {
        setJiraSaving(true);
        try {
            await settingsApi.saveJira({ baseUrl: jiraUrl, username: jiraUsername, apiToken: jiraToken });
            showToast('success', 'JIRA settings saved');
            setJiraToken(''); // Clear the token from UI after saving
        } catch (err: any) {
            showToast('error', err.message);
        } finally {
            setJiraSaving(false);
        }
    };

    const handleTestJira = async () => {
        setJiraTesting(true);
        try {
            const res = await settingsApi.testJira();
            setJiraStatus({ connected: res.connected, message: res.message });
        } catch (err: any) {
            setJiraStatus({ connected: false, message: err.message });
        } finally {
            setJiraTesting(false);
        }
    };

    const handleSaveLlm = async () => {
        setLlmSaving(true);
        try {
            await settingsApi.saveLlm({
                provider: llmProvider,
                groqApiKey: groqKey || undefined,
                groqModel,
                groqTemperature: groqTemp,
                ollamaBaseUrl: ollamaUrl,
                ollamaModel,
            });
            showToast('success', 'LLM settings saved');
            setGroqKey('');
            fetchGroqModels(); // Refresh models after saving (in case API key changed)
        } catch (err: any) {
            showToast('error', err.message);
        } finally {
            setLlmSaving(false);
        }
    };

    const handleTestGroq = async () => {
        try {
            const res = await settingsApi.testGroq();
            setGroqStatus({ connected: res.connected, message: res.message });
        } catch (err: any) {
            setGroqStatus({ connected: false, message: err.message });
        }
    };

    const handleTestOllama = async () => {
        try {
            const res = await settingsApi.testOllama();
            setOllamaStatus({ connected: res.connected, message: res.message });
        } catch (err: any) {
            setOllamaStatus({ connected: false, message: err.message });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            showToast('error', 'Only PDF files are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'File size must be under 5MB');
            return;
        }

        setUploading(true);
        try {
            const res = await templatesApi.upload(file);
            if (res.success) {
                showToast('success', `Template "${res.template.name}" uploaded`);
                loadTemplates();
            } else {
                showToast('error', res.error || 'Upload failed');
            }
        } catch (err: any) {
            showToast('error', err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        try {
            await templatesApi.delete(id);
            showToast('success', 'Template deleted');
            loadTemplates();
        } catch (err: any) {
            showToast('error', err.message);
        }
    };

    const ConnectionBadge = ({ status }: { status: { connected: boolean; message: string } | null }) => {
        if (!status) return null;
        return (
            <div className={`flex items-center gap-2 mt-3 text-xs ${status.connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {status.connected ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {status.message}
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <SettingsIcon size={28} className="text-brand-400" />
                    Settings
                </h1>
                <p className="text-surface-400 mt-2">Configure JIRA credentials, LLM providers, and test plan templates.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-surface-900/50 rounded-xl w-fit border border-white/[0.04]">
                {([
                    { key: 'jira', label: 'JIRA', icon: Globe },
                    { key: 'llm', label: 'LLM Provider', icon: Brain },
                    { key: 'templates', label: 'Templates', icon: FileUp },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        id={`tab-${tab.key}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key
                            ? 'bg-brand-500/20 text-brand-300 shadow-sm'
                            : 'text-surface-400 hover:text-surface-200'
                            }`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <tab.icon size={15} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* JIRA Settings */}
            {activeTab === 'jira' && (
                <div className="glass-card p-6 animate-fade-in">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Globe size={18} className="text-brand-400" />
                        JIRA Configuration
                    </h2>

                    <div className="space-y-4 max-w-xl">
                        <div>
                            <label className="block text-sm text-surface-400 mb-1.5">JIRA Base URL</label>
                            <input
                                id="jira-url"
                                type="url"
                                className="input-field"
                                placeholder="https://company.atlassian.net"
                                value={jiraUrl}
                                onChange={e => setJiraUrl(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-surface-400 mb-1.5">Username / Email</label>
                            <input
                                id="jira-username"
                                type="text"
                                className="input-field"
                                placeholder="your.email@company.com"
                                value={jiraUsername}
                                onChange={e => setJiraUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-surface-400 mb-1.5">API Token</label>
                            <input
                                id="jira-token"
                                type="password"
                                className="input-field"
                                placeholder="Enter API token (stored encrypted)"
                                value={jiraToken}
                                onChange={e => setJiraToken(e.target.value)}
                            />
                            <p className="text-[11px] text-surface-600 mt-1">
                                Get your token from <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">Atlassian API Tokens</a>
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button id="save-jira" className="btn-primary flex items-center gap-2" onClick={handleSaveJira} disabled={jiraSaving}>
                                {jiraSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                                Save Settings
                            </button>
                            <button id="test-jira" className="btn-secondary flex items-center gap-2" onClick={handleTestJira} disabled={jiraTesting}>
                                {jiraTesting ? <Loader2 size={14} className="animate-spin" /> : null}
                                Test Connection
                            </button>
                        </div>

                        <ConnectionBadge status={jiraStatus} />
                    </div>
                </div>
            )}

            {/* LLM Settings */}
            {activeTab === 'llm' && (
                <div className="glass-card p-6 animate-fade-in">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Brain size={18} className="text-brand-400" />
                        LLM Provider Configuration
                    </h2>

                    {/* Provider Toggle */}
                    <div className="mb-6">
                        <label className="block text-sm text-surface-400 mb-2">Active Provider</label>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${llmProvider === 'groq'
                                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                    : 'bg-surface-800/50 text-surface-400 border border-white/[0.04] hover:text-surface-200'
                                    }`}
                                onClick={() => setLlmProvider('groq')}
                            >
                                ☁️ Groq (Cloud)
                            </button>
                            <button
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${llmProvider === 'ollama'
                                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                    : 'bg-surface-800/50 text-surface-400 border border-white/[0.04] hover:text-surface-200'
                                    }`}
                                onClick={() => setLlmProvider('ollama')}
                            >
                                🖥️ Ollama (Local)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Groq */}
                        <div className={`p-5 rounded-xl border transition-all ${llmProvider === 'groq' ? 'border-brand-500/30 bg-brand-500/5' : 'border-white/[0.04] bg-surface-900/30 opacity-60'}`}>
                            <h3 className="text-sm font-semibold mb-4 text-surface-300">☁️ Groq Configuration</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1">API Key</label>
                                    <input
                                        id="groq-key"
                                        type="password"
                                        className="input-field text-sm"
                                        placeholder="gsk_..."
                                        value={groqKey}
                                        onChange={e => setGroqKey(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1">Model</label>
                                    <select id="groq-model" className="input-field text-sm" value={groqModel} onChange={e => setGroqModel(e.target.value)}>
                                        {groqModels.length > 0 ? (
                                            groqModels.map((model: any) => (
                                                <option key={model.id} value={model.id}>
                                                    {model.id}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="llama3-70b-8192">Llama 3 70B</option>
                                                <option value="llama3-8b-8192">Llama 3 8B</option>
                                                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                                <option value="gemma-7b-it">Gemma 7B</option>
                                                <option value="gemma2-9b-it">Gemma 2 9B</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1">Temperature: {groqTemp.toFixed(1)}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={groqTemp}
                                        onChange={e => setGroqTemp(parseFloat(e.target.value))}
                                        className="w-full accent-brand-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-surface-600">
                                        <span>Precise</span>
                                        <span>Creative</span>
                                    </div>
                                </div>
                                <button className="btn-secondary text-xs w-full" onClick={handleTestGroq}>Test Groq Connection</button>
                                <ConnectionBadge status={groqStatus} />
                            </div>
                        </div>

                        {/* Ollama */}
                        <div className={`p-5 rounded-xl border transition-all ${llmProvider === 'ollama' ? 'border-brand-500/30 bg-brand-500/5' : 'border-white/[0.04] bg-surface-900/30 opacity-60'}`}>
                            <h3 className="text-sm font-semibold mb-4 text-surface-300">🖥️ Ollama Configuration</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1">Base URL</label>
                                    <input
                                        id="ollama-url"
                                        type="url"
                                        className="input-field text-sm"
                                        placeholder="http://localhost:11434"
                                        value={ollamaUrl}
                                        onChange={e => setOllamaUrl(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1">Model Name</label>
                                    <input
                                        id="ollama-model"
                                        type="text"
                                        className="input-field text-sm"
                                        placeholder="llama3, codellama, etc."
                                        value={ollamaModel}
                                        onChange={e => setOllamaModel(e.target.value)}
                                    />
                                </div>
                                <button className="btn-secondary text-xs w-full" onClick={handleTestOllama}>Test Ollama Connection</button>
                                <ConnectionBadge status={ollamaStatus} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button id="save-llm" className="btn-primary flex items-center gap-2" onClick={handleSaveLlm} disabled={llmSaving}>
                            {llmSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                            Save LLM Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Templates */}
            {activeTab === 'templates' && (
                <div className="glass-card p-6 animate-fade-in">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <FileUp size={18} className="text-brand-400" />
                        Template Management
                    </h2>

                    {/* Upload */}
                    <div className="mb-6">
                        <label className="dropzone flex flex-col items-center gap-3">
                            <Upload size={32} className="text-brand-400" />
                            <div>
                                <p className="text-sm text-surface-300 font-medium">
                                    {uploading ? 'Uploading...' : 'Click to upload a PDF template'}
                                </p>
                                <p className="text-xs text-surface-500 mt-1">PDF files only · Max 5MB</p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {/* Template List */}
                    <div className="space-y-3">
                        {templates.length === 0 ? (
                            <div className="text-center py-8 text-surface-500 text-sm">
                                No templates uploaded yet. Upload a PDF to get started.
                            </div>
                        ) : (
                            templates.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-900/40 border border-white/[0.04] hover:border-brand-500/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                                            <FileUp size={18} className="text-brand-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-surface-200">{t.name}</p>
                                            <p className="text-xs text-surface-500">{t.filename} · {new Date(t.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-danger text-xs !px-3 !py-1.5"
                                        onClick={() => handleDeleteTemplate(t.id)}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
