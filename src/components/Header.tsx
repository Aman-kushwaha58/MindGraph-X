import React, { useState } from 'react';
import { HealthBadge } from './HealthBadge';
import { ThemeToggle } from './ThemeToggle';
import { Sparkles, RefreshCw, Upload, Search, HelpCircle, Headphones } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  title: string;
  subtitle?: string;
  onRefreshGraph?: () => void;
  onNavigateToQuiz?: (concept: string) => void;
  onNavigateToUpload?: () => void;
  activeTab?: string;
  voiceMode?: boolean;
  onToggleVoiceMode?: () => void;
}

export const Header: React.FC<Props> = ({
  title,
  subtitle,
  onRefreshGraph,
  onNavigateToQuiz,
  onNavigateToUpload,
  activeTab,
  voiceMode,
  onToggleVoiceMode,
}) => {
  const [recomputing, setRecomputing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleRecompute = async () => {
    try {
      setRecomputing(true);
      const res = await api.recompute();
      setNotification('Graph state & forgetting risks recomputed successfully.');
      setTimeout(() => setNotification(null), 3500);
      if (onRefreshGraph) onRefreshGraph();
    } catch (err) {
      console.error(err);
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <header className="h-16 border-b border-border-subtle bg-bg-surface/85 backdrop-blur-md px-6 flex items-center justify-between z-30 select-none">
      <div>
        <h1 className="text-base font-bold text-text-primary flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {notification && (
          <div className="text-xs px-3 py-1 rounded-full bg-accent-purple/20 text-accent-purple border border-border-accent animate-fade-in font-medium">
            {notification}
          </div>
        )}

        {/* Global actions */}
        <button
          onClick={handleRecompute}
          disabled={recomputing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          title="Recompute all forgetting probabilities & bottleneck rankings"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent-purple ${recomputing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Recompute State</span>
        </button>

        {onNavigateToUpload && (
          <button
            onClick={onNavigateToUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-text-secondary" />
            <span className="hidden sm:inline">Ingest PDF</span>
          </button>
        )}

        {/* Voice-mode toggle: in the Mentor page header */}
        {activeTab === 'mentor' && onToggleVoiceMode && (
          <button
            onClick={onToggleVoiceMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              voiceMode
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-500/40'
                : 'bg-bg-surface hover:bg-bg-elevated border-border-subtle hover:border-border-accent text-accent-purple'
            }`}
            title="Toggle Hands-Free Voice Conversation Mode"
            aria-label="Toggle Hands-Free Voice Conversation Mode"
          >
            <Headphones className={`w-3.5 h-3.5 ${voiceMode ? 'animate-bounce text-white' : 'text-accent-purple'}`} />
            <span className="hidden sm:inline">{voiceMode ? 'Voice Mode: ON' : 'Voice Mode'}</span>
            {voiceMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
          </button>
        )}

        {/* Theme Switcher Sun/Moon Toggle */}
        <ThemeToggle />

        <HealthBadge />
      </div>
    </header>
  );
};
