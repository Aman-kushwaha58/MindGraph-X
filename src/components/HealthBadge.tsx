import React, { useEffect, useState } from 'react';
import { HealthStatus } from '../types';
import { api } from '../services/api';
import { Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const HealthBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-bg-surface border border-border-subtle text-xs font-mono text-text-secondary hover:border-border-accent transition-colors"
        title="Application storage status"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
              isHealthy ? 'bg-success' : 'bg-warning'
            } opacity-75`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isHealthy ? 'bg-success' : 'bg-warning'
            }`}
          ></span>
        </span>
        <span className="hidden sm:inline">App Ready</span>
        <span className="text-[10px] text-success font-semibold">LOCAL</span>
      </button>

      {showTooltip && (
        <div className="absolute right-0 mt-2 w-72 p-3 bg-bg-surface border border-border-accent rounded-xl shadow-2xl z-50 text-xs text-text-secondary">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle font-semibold text-text-primary">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-accent-purple" />
              Application Storage
            </span>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="text-text-muted hover:text-text-primary"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Knowledge workspace</span>
              <span className="flex items-center gap-1 text-success font-mono">
                <CheckCircle2 className="w-3 h-3" />
                In memory
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">User accounts</span>
              <span className="flex items-center gap-1 text-success font-mono">
                <CheckCircle2 className="w-3 h-3" />
                JSON file
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Loaded concepts</span>
              <span className="text-text-primary font-mono">
                {health?.storage.concepts_count ?? 0}
              </span>
            </div>
          </div>
          <div className="mt-2.5 flex gap-1.5 pt-2 border-t border-border-subtle text-[10px] text-text-muted">
            <AlertTriangle className="w-3 h-3 shrink-0 text-warning" />
            <span>
              Workspace data resets when the server restarts. Accounts are saved to{' '}
              <span className="text-accent-purple font-mono">{health?.storage.users_file ?? 'data/users.json'}</span>.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
