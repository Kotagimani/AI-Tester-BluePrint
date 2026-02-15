import { NavLink } from 'react-router-dom';
import { Zap, Settings, History, FlaskConical } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex min-h-screen w-full">
            {/* Sidebar */}
            <aside className="w-[260px] min-h-screen border-r border-white/[0.06] bg-surface-950/80 backdrop-blur-xl flex flex-col">
                {/* Logo */}
                <div className="px-6 py-6 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <FlaskConical size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white tracking-tight">TestPlan AI</h1>
                            <p className="text-[11px] text-surface-500 font-medium">Intelligent Generator</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <NavLink
                        to="/generate"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Zap size={18} />
                        <span>Generate</span>
                    </NavLink>

                    <NavLink
                        to="/history"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <History size={18} />
                        <span>History</span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </NavLink>
                </nav>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
                        <span className="text-xs text-surface-500">System Online</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-y-auto relative z-10">
                <div className="max-w-6xl mx-auto px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
