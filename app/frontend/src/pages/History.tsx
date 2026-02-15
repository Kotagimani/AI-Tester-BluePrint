import { useState, useEffect } from 'react';
import { History as HistoryIcon, FileText, ExternalLink, Clock, Cpu, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { testPlanApi } from '../services/api';

interface HistoryProps {
    showToast: (type: 'success' | 'error', message: string) => void;
}

interface PlanSummary {
    id: number;
    ticket_id: string;
    ticket_summary: string;
    provider: string;
    model: string;
    metadata: { tokensUsed: number; generationTimeMs: number } | null;
    created_at: string;
}

interface PlanDetail {
    id: number;
    ticket_id: string;
    ticket_summary: string;
    content: string;
    provider: string;
    model: string;
    metadata: { tokensUsed: number; generationTimeMs: number } | null;
    created_at: string;
}

export default function History({ showToast }: HistoryProps) {
    const [plans, setPlans] = useState<PlanSummary[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        testPlanApi.getHistory().then(res => {
            if (res.success) setPlans(res.plans || []);
        }).catch(err => {
            showToast('error', 'Failed to load history');
        }).finally(() => setLoading(false));
    }, []);

    const handleViewPlan = async (id: number) => {
        setLoadingDetail(true);
        try {
            const res = await testPlanApi.getById(id);
            if (res.success) setSelectedPlan(res.testPlan);
        } catch (err: any) {
            showToast('error', err.message);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCopy = () => {
        if (selectedPlan?.content) {
            navigator.clipboard.writeText(selectedPlan.content);
            showToast('success', 'Copied to clipboard');
        }
    };

    const handleExport = () => {
        if (!selectedPlan?.content) return;
        const blob = new Blob([selectedPlan.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `testplan-${selectedPlan.ticket_id}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <HistoryIcon size={28} className="text-brand-400" />
                    History
                </h1>
                <p className="text-surface-400 mt-2">Browse and review previously generated test plans.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plan List */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-4">
                        <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider px-2 mb-3">
                            Generated Plans ({plans.length})
                        </h3>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="skeleton h-20 rounded-xl" />
                                ))}
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="text-center py-12 text-surface-500">
                                <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No test plans generated yet.</p>
                                <p className="text-xs mt-1">Go to Generate to create your first test plan.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                                {plans.map(plan => (
                                    <button
                                        key={plan.id}
                                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${selectedPlan?.id === plan.id
                                                ? 'bg-brand-500/15 border border-brand-500/25'
                                                : 'bg-surface-900/30 border border-white/[0.02] hover:bg-surface-800/50 hover:border-white/[0.06]'
                                            }`}
                                        onClick={() => handleViewPlan(plan.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono font-semibold text-brand-300">{plan.ticket_id}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${plan.provider === 'groq' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-violet-500/15 text-violet-400'
                                                        }`}>
                                                        {plan.provider}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-surface-400 truncate">{plan.ticket_summary || 'Untitled'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-surface-600">
                                            <span className="flex items-center gap-1"><Clock size={10} />{formatDate(plan.created_at)}</span>
                                            <span className="flex items-center gap-1"><Cpu size={10} />{plan.model}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Plan Detail */}
                <div className="lg:col-span-2">
                    {loadingDetail ? (
                        <div className="glass-card p-8 flex items-center justify-center">
                            <Loader2 size={24} className="animate-spin text-brand-400" />
                        </div>
                    ) : selectedPlan ? (
                        <div className="glass-card p-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-sm font-mono font-bold text-brand-300">{selectedPlan.ticket_id}</span>
                                        <span className="badge badge-info text-[10px]">{selectedPlan.provider} / {selectedPlan.model}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{selectedPlan.ticket_summary}</h3>
                                    <p className="text-xs text-surface-500 mt-1">Generated {formatDate(selectedPlan.created_at)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn-secondary text-xs" onClick={handleCopy}>Copy</button>
                                    <button className="btn-secondary text-xs" onClick={handleExport}>Export</button>
                                </div>
                            </div>

                            <div className="bg-surface-950/60 rounded-xl p-6 max-h-[calc(100vh-320px)] overflow-y-auto border border-white/[0.04]">
                                <div className="markdown-content">
                                    <ReactMarkdown>{selectedPlan.content}</ReactMarkdown>
                                </div>
                            </div>

                            {selectedPlan.metadata && (
                                <div className="mt-3 flex gap-4 text-xs text-surface-500">
                                    <span>Tokens: {selectedPlan.metadata.tokensUsed}</span>
                                    <span>Time: {((selectedPlan.metadata.generationTimeMs || 0) / 1000).toFixed(1)}s</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
                            <FileText size={48} className="text-surface-700 mb-4" />
                            <h3 className="text-lg font-medium text-surface-400 mb-2">Select a test plan</h3>
                            <p className="text-sm text-surface-600">Choose a plan from the list to view its content.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
