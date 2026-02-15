import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import History from './pages/History';

export interface Toast {
    id: number;
    type: 'success' | 'error';
    message: string;
}

function App() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Navigate to="/generate" replace />} />
                    <Route path="/generate" element={<Dashboard showToast={showToast} />} />
                    <Route path="/settings" element={<Settings showToast={showToast} />} />
                    <Route path="/history" element={<History showToast={showToast} />} />
                </Routes>
            </Layout>

            {/* Toast Notifications */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    >
                        {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                    </div>
                ))}
            </div>

            {/* Ambient Background Effects */}
            <div className="ambient-glow" />
            <div className="ambient-glow-2" />
        </BrowserRouter>
    );
}

export default App;
