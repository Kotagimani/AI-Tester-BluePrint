import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Sparkles, Download, Copy, FileText, ChevronRight, Clock, Tag, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jiraApi, testPlanApi, templatesApi } from '../services/api';

interface DashboardProps {
    showToast: (type: 'success' | 'error', message: string) => void;
}

interface TicketData {
    ticketId: string;
    summary: string;
    description: string;
    priority: string;
    status: string;
    assignee: string;
    labels: string[];
    acceptanceCriteria: string;
    attachments: { filename: string; url: string }[];
}

interface TestPlanResult {
    id: number;
    content: string;
    provider: string;
    model: string;
    metadata: { tokensUsed: number; generationTimeMs: number };
}

interface Template {
    id: number;
    name: string;
    filename: string;
}

type WorkflowStep = 'input' | 'fetching' | 'display' | 'generating' | 'complete';

export default function Dashboard({ showToast }: DashboardProps) {
    const [ticketId, setTicketId] = useState('');
    const [step, setStep] = useState<WorkflowStep>('input');
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [testPlan, setTestPlan] = useState<TestPlanResult | null>(null);
    const [recentTickets, setRecentTickets] = useState<{ ticket_id: string; summary: string }[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>();
    const [provider, setProvider] = useState<string>('groq');
    const [showPreview, setShowPreview] = useState(true);

    useEffect(() => {
        jiraApi.getRecent().then(res => {
            if (res.success) setRecentTickets(res.tickets || []);
        }).catch(() => { });

        templatesApi.getAll().then(res => {
            if (res.success) setTemplates(res.templates || []);
        }).catch(() => { });
    }, []);

    // Keyboard shortcut: Ctrl+Enter to generate
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter' && step === 'display' && ticket) {
                handleGenerate();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [step, ticket]);

    const handleFetch = async () => {
        if (!ticketId.trim()) return;
        setStep('fetching');
        try {
            const res = await jiraApi.fetch(ticketId.trim());
            if (res.success) {
                setTicket(res.ticket);
                setStep('display');
                showToast('success', `Ticket ${res.ticket.ticketId} fetched successfully`);
                // Refresh recent
                jiraApi.getRecent().then(r => {
                    if (r.success) setRecentTickets(r.tickets || []);
                });
            }
        } catch (err: any) {
            showToast('error', err.message);
            setStep('input');
        }
    };

    const handleGenerate = async () => {
        if (!ticket) return;
        setStep('generating');
        try {
            const res = await testPlanApi.generate({
                ticketId: ticket.ticketId,
                templateId: selectedTemplate,
                provider,
            });
            if (res.success) {
                setTestPlan(res.testPlan);
                setStep('complete');
                showToast('success', 'Test plan generated successfully!');
            }
        } catch (err: any) {
            showToast('error', err.message);
            setStep('display');
        }
    };

    const handleCopy = useCallback(() => {
        if (testPlan?.content) {
            navigator.clipboard.writeText(testPlan.content);
            showToast('success', 'Copied to clipboard');
        }
    }, [testPlan, showToast]);

    const handleExportMd = useCallback(() => {
        if (!testPlan?.content) return;
        const blob = new Blob([testPlan.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `testplan-${ticket?.ticketId || 'export'}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('success', 'Markdown file downloaded');
    }, [testPlan, ticket, showToast]);

    const handleReset = () => {
        setTicketId('');
        setTicket(null);
        setTestPlan(null);
        setStep('input');
    };

    const priorityColor = (p: string) => {
        switch (p?.toLowerCase()) {
            case 'highest': case 'critical': return 'text-red-400';
            case 'high': return 'text-orange-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-green-400';
            default: return 'text-surface-400';
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Generate Test Plan</h1>
                <p className="text-surface-400 mt-2">Enter a JIRA ticket ID to auto-generate a comprehensive test plan using AI.</p>
            </div>

            {/* Workflow Progress Bar */}
            <div className="flex items-center gap-2 mb-8">
                {(['Input', 'Fetch', 'Review', 'Generate', 'Complete'] as const).map((label, i) => {
                    const stepMap: Record<string, number> = { input: 0, fetching: 1, display: 2, generating: 3, complete: 4 };
                    const currentIdx = stepMap[step];
                    const isActive = i === currentIdx;
                    const isCompleted = i < currentIdx;

                    return (
                        <div key={label} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                    isActive ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-lg shadow-brand-500/10' :
                                        'bg-surface-800/50 text-surface-500 border border-white/[0.04]'
                                }`}>
                                {isCompleted ? <CheckCircle2 size={12} /> : <span className="w-4 text-center">{i + 1}</span>}
                                {label}
                            </div>
                            {i < 4 && <ChevronRight size={14} className="text-surface-700" />}
                        </div>
                    );
                })}
            </div>

            {/* Step 1: Ticket Input */}
            <div className="glass-card p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Search size={18} className="text-brand-400" />
                    <h2 className="text-lg font-semibold">JIRA Ticket</h2>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            id="ticket-input"
                            type="text"
                            className="input-field font-mono text-base"
                            placeholder="Enter ticket ID (e.g., VWO-123)"
                            value={ticketId}
                            onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                            disabled={step === 'fetching' || step === 'generating'}
                        />
                    </div>
                    <button
                        id="fetch-button"
                        className="btn-primary flex items-center gap-2"
                        onClick={handleFetch}
                        disabled={!ticketId.trim() || step === 'fetching' || step === 'generating'}
                    >
                        {step === 'fetching' ? (
                            <><Loader2 size={16} className="animate-spin" /> Fetching...</>
                        ) : (
                            <><Search size={16} /> Fetch Ticket</>
                        )}
                    </button>
                    {step !== 'input' && (
                        <button className="btn-secondary" onClick={handleReset}>
                            New
                        </button>
                    )}
                </div>

                {/* Recent Tickets */}
                {recentTickets.length > 0 && step === 'input' && (
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <Clock size={14} className="text-surface-500" />
                        <span className="text-xs text-surface-500">Recent:</span>
                        {recentTickets.map(t => (
                            <button
                                key={t.ticket_id}
                                className="text-xs px-2.5 py-1 rounded-lg bg-surface-800/60 text-brand-300 hover:bg-surface-700/60 transition-colors border border-white/[0.04]"
                                onClick={() => { setTicketId(t.ticket_id); }}
                            >
                                {t.ticket_id}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Step 2: Ticket Display */}
            {ticket && step !== 'input' && step !== 'fetching' && (
                <div className="glass-card p-6 mb-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-brand-400" />
                            <h2 className="text-lg font-semibold">Ticket Details</h2>
                            <span className="badge badge-info">{ticket.ticketId}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-white mb-3">{ticket.summary}</h3>

                        <div className="flex flex-wrap gap-3 mb-4">
                            <div className={`badge ${ticket.priority?.toLowerCase() === 'high' || ticket.priority?.toLowerCase() === 'highest' ? 'badge-danger' : ticket.priority?.toLowerCase() === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                                <AlertTriangle size={11} className="mr-1" />
                                {ticket.priority}
                            </div>
                            <div className="badge badge-info">{ticket.status}</div>
                            <div className="flex items-center gap-1.5 text-xs text-surface-400">
                                <User size={12} />
                                {ticket.assignee}
                            </div>
                            {ticket.labels?.map(l => (
                                <div key={l} className="flex items-center gap-1 text-xs text-surface-400">
                                    <Tag size={11} />
                                    {l}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    {ticket.description && (
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Description</h4>
                            <div className="bg-surface-900/50 rounded-lg p-4 text-sm text-surface-300 leading-relaxed whitespace-pre-wrap border border-white/[0.04]">
                                {ticket.description}
                            </div>
                        </div>
                    )}

                    {/* Acceptance Criteria */}
                    {ticket.acceptanceCriteria && (
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Acceptance Criteria</h4>
                            <div className="bg-surface-900/50 rounded-lg p-4 text-sm text-surface-300 leading-relaxed whitespace-pre-wrap border border-white/[0.04]">
                                {ticket.acceptanceCriteria}
                            </div>
                        </div>
                    )}

                    {/* Generation Controls */}
                    {(step === 'display' || step === 'generating') && (
                        <div className="mt-6 pt-6 border-t border-white/[0.06]">
                            <div className="flex items-center gap-4 flex-wrap">
                                {/* Template Selector */}
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-surface-400 whitespace-nowrap">Template:</label>
                                    <select
                                        id="template-selector"
                                        className="input-field !w-auto !py-2 text-xs"
                                        value={selectedTemplate || ''}
                                        onChange={(e) => setSelectedTemplate(e.target.value ? parseInt(e.target.value) : undefined)}
                                    >
                                        <option value="">Default (No template)</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Provider Selector */}
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-surface-400 whitespace-nowrap">LLM:</label>
                                    <select
                                        id="provider-selector"
                                        className="input-field !w-auto !py-2 text-xs"
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value)}
                                    >
                                        <option value="groq">☁️ Groq (Cloud)</option>
                                        <option value="ollama">🖥️ Ollama (Local)</option>
                                    </select>
                                </div>

                                {/* Generate Button */}
                                <button
                                    id="generate-button"
                                    className="btn-primary flex items-center gap-2 ml-auto"
                                    onClick={handleGenerate}
                                    disabled={step === 'generating'}
                                >
                                    {step === 'generating' ? (
                                        <><Loader2 size={16} className="animate-spin" /> Generating...</>
                                    ) : (
                                        <><Sparkles size={16} /> Generate Test Plan</>
                                    )}
                                </button>
                            </div>
                            <p className="text-[11px] text-surface-600 mt-2">Press <kbd className="px-1.5 py-0.5 rounded bg-surface-800 text-surface-400 text-[10px]">Ctrl+Enter</kbd> to generate</p>
                        </div>
                    )}
                </div>
            )}

            {/* Loading Animation */}
            {step === 'generating' && (
                <div className="glass-card p-8 mb-6 animate-fade-in">
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4 animate-pulse-subtle shadow-lg shadow-brand-500/30">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Generating Test Plan</h3>
                        <p className="text-sm text-surface-400 mb-6">AI is analyzing the ticket and creating test scenarios...</p>
                        <div className="w-64 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full animate-shimmer" style={{ backgroundSize: '200% 100%', width: '100%' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Output */}
            {testPlan && step === 'complete' && (
                <div className="glass-card p-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className="text-emerald-400" />
                            <h2 className="text-lg font-semibold">Generated Test Plan</h2>
                            <span className="badge badge-success">Complete</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-surface-500">
                                {testPlan.provider} / {testPlan.model} · {testPlan.metadata?.tokensUsed} tokens · {((testPlan.metadata?.generationTimeMs || 0) / 1000).toFixed(1)}s
                            </span>
                            <div className="flex gap-1 ml-3">
                                <button
                                    className="text-xs px-2 py-1 rounded-md bg-surface-800/80 text-surface-300 hover:text-white transition-colors"
                                    onClick={() => setShowPreview(!showPreview)}
                                >
                                    {showPreview ? 'Raw' : 'Preview'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-surface-950/60 rounded-xl p-6 mb-4 max-h-[600px] overflow-y-auto border border-white/[0.04]">
                        {showPreview ? (
                            <div className="markdown-content">
                                <ReactMarkdown>{testPlan.content}</ReactMarkdown>
                            </div>
                        ) : (
                            <pre className="text-sm text-surface-300 font-mono whitespace-pre-wrap">{testPlan.content}</pre>
                        )}
                    </div>

                    {/* Export Actions */}
                    <div className="flex items-center gap-3">
                        <button id="copy-button" className="btn-secondary flex items-center gap-2" onClick={handleCopy}>
                            <Copy size={14} /> Copy to Clipboard
                        </button>
                        <button id="export-md-button" className="btn-secondary flex items-center gap-2" onClick={handleExportMd}>
                            <Download size={14} /> Export Markdown
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
