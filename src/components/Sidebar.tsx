import React from 'react';
import {
  LayoutDashboard,
  Network,
  GitBranch,
  CalendarDays,
  Bot,
  HelpCircle,
  Clock,
  BarChart3,
  FileText,
  Sparkles,
  BookOpenCheck,
  LogOut,
  Wand2,
} from 'lucide-react';
import { User } from '../types';
import { ThemeToggle } from './ThemeToggle';

export type TabId =
  | 'dashboard'
  | 'graph'
  | 'gaps'
  | 'planner'
  | 'mentor'
  | 'quiz'
  | 'ai-tools'
  | 'documents'
  | 'timeline'
  | 'evaluation';

interface Props {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  bottleneckCount: number;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  bottleneckCount,
  currentUser,
  onLogout,
}) => {
  const navItems: Array<{ id: TabId; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'gaps', label: 'Knowledge Gaps', icon: GitBranch },
    {
      id: 'quiz',
      label: 'Diagnostic Quiz',
      icon: HelpCircle,
      badge: bottleneckCount > 0 ? `${bottleneckCount} At Risk` : undefined,
    },
    { id: 'ai-tools', label: 'AI Tools', icon: Wand2, badge: 'Smart' },
    { id: 'planner', label: 'Revision Planner', icon: CalendarDays },
    { id: 'mentor', label: 'Grounded AI Mentor', icon: Bot },
    { id: 'documents', label: 'Document Ingestion', icon: FileText },
    { id: 'timeline', label: 'Timeline & History', icon: Clock },
    { id: 'evaluation', label: 'Evaluation Harness', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-bg-surface/90 backdrop-blur-xl border-r border-border-subtle flex flex-col h-full select-none">
      {/* Brand logo & title */}
      <div className="p-5 border-b border-border-subtle flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/30 flex items-center justify-center">
          <div className="w-full h-full bg-bg-primary rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent-purple-light" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-text-primary">MindGraph</span>
            <span className="text-xs px-1.5 py-0.2 rounded bg-accent-purple/20 text-accent-purple font-mono font-bold border border-border-accent">
              X
            </span>
          </div>
          <p className="text-[10px] text-text-secondary font-mono">Learning Intelligence</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-mono tracking-wider text-text-muted">
          Core Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent-purple text-white shadow-lg shadow-purple-600/25 font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-text-secondary'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-purple-800 text-purple-100'
                      : 'bg-danger-bg text-danger border border-danger/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System state / Active Bottleneck Notice */}
      <div className="p-3.5 m-3 rounded-xl bg-bg-elevated/70 border border-border-accent text-xs">
        <div className="flex items-center gap-1.5 text-accent-purple font-semibold text-[11px]">
          <BookOpenCheck className="w-3.5 h-3.5" />
          Active Bottleneck Detected
        </div>
        <p className="text-[10px] text-text-secondary mt-1">
          <strong className="text-text-primary">Attention</strong> (~27% verified mastery) is constraining 5 downstream concepts.
        </p>
        <button
          onClick={() => onSelectTab('quiz')}
          className="mt-2 w-full py-1 rounded bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple text-[10px] font-semibold border border-border-accent transition-colors cursor-pointer"
        >
          Unblock with Quiz &rarr;
        </button>
      </div>

      {/* Footer User Profile & Logout */}
      <div className="p-3 border-t border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-accent-purple/20 border border-border-accent flex items-center justify-center text-xs font-bold text-accent-purple shrink-0">
            {currentUser?.name
              ? currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'AM'}
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-xs font-semibold text-text-primary truncate">{currentUser?.name || 'Alex Mercer'}</p>
            <p className="text-[10px] text-text-secondary font-mono truncate">{currentUser?.email || 'demo@mindgraph.ai'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          <ThemeToggle />
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-secondary hover:text-danger transition-colors cursor-pointer"
              title="Log out of session"
              aria-label="Log out of session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
