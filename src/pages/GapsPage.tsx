import React, { useEffect, useState } from 'react';
import { KnowledgeGap } from '../types';
import { api } from '../services/api';
import {
  GitBranch,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface Props {
  onLaunchQuiz: (conceptName: string) => void;
  onSelectConcept: (conceptName: string) => void;
}

export const GapsPage: React.FC<Props> = ({ onLaunchQuiz, onSelectConcept }) => {
  const [target, setTarget] = useState('RAG');
  const [gapData, setGapData] = useState<KnowledgeGap | null>(null);
  const [loading, setLoading] = useState(true);

  const targetOptions = ['RAG', 'Transformer', 'LLM', 'Vector Search', 'Sequence Modeling', 'CNN'];

  const fetchGaps = async (selectedTarget: string) => {
    try {
      setLoading(true);
      const res = await api.getGaps(selectedTarget);
      setGapData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps(target);
  }, [target]);

  const severityColor =
    gapData?.gap_severity === 'CRITICAL'
      ? 'bg-danger-bg text-danger border-danger/40'
      : gapData?.gap_severity === 'HIGH'
      ? 'bg-warning-bg text-warning border-warning/40'
      : 'bg-warning-bg text-warning border-warning/40';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header & Target Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-semibold border border-border-accent">
              Structural Traversal (Depth &le; 4)
            </span>
            <span className="text-xs text-text-muted">Dependency Chain Analysis</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary mt-1">
            Knowledge Gap Identification
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Traces all recursive prerequisite dependencies to identify unmastered prerequisite nodes causing learning bottlenecks.
          </p>
        </div>

        {/* Target Concept Selector Dropdown */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <span className="text-xs text-text-muted font-mono">Target Goal:</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="px-3 py-2 bg-bg-elevated border border-border-subtle rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-accent-purple cursor-pointer"
          >
            {targetOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !gapData ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-mono">Traversing prerequisite paths in semantic graph...</p>
        </div>
      ) : gapData ? (
        <>
          {/* Summary Alert Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex items-center justify-between">
              <div>
                <p className="text-[11px] text-text-muted">Gap Severity Level</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${severityColor}`}
                  >
                    {gapData.gap_severity} SEVERITY
                  </span>
                </div>
              </div>
              <ShieldAlert className="w-6 h-6 text-danger" />
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex items-center justify-between">
              <div>
                <p className="text-[11px] text-text-muted">Weak Prerequisites Count</p>
                <p className="text-2xl font-extrabold text-text-primary font-mono mt-0.5">
                  {gapData.weak_prerequisites_count}{' '}
                  <span className="text-xs text-text-muted font-normal">/ {gapData.total_prerequisites} total</span>
                </p>
              </div>
              <Layers className="w-6 h-6 text-warning" />
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex items-center justify-between">
              <div>
                <p className="text-[11px] text-text-muted">Recommended Bridge Topic</p>
                <p className="text-sm font-bold text-accent-purple mt-0.5">
                  {gapData.recommended_bridge.start_concept}
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-accent-purple" />
            </div>
          </div>

          {/* Recommended Bridge Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-accent-purple/15 via-bg-surface to-bg-surface border border-border-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-purple">
                <Sparkles className="w-4 h-4 text-accent-purple" />
                Actionable Bridge Recommendation
              </div>
              <p className="text-xs text-text-secondary">
                {gapData.recommended_bridge.reason}
              </p>
            </div>
            <button
              onClick={() => onLaunchQuiz(gapData.recommended_bridge.start_concept)}
              className="px-4 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              Bridge Gap via Quiz ({gapData.recommended_bridge.start_concept}) &rarr;
            </button>
          </div>

          {/* Upstream Prerequisite Path Visual DAG */}
          <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-accent-purple" />
                  Prerequisite Path Traversal to "{target}"
                </h3>
                <p className="text-xs text-text-muted">
                  Ordered by dependency depth. Nodes highlighted in red have verified mastery &lt; 50%.
                </p>
              </div>
              <span className="text-[11px] font-mono text-accent-purple">Recursive DFS Traversal</span>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-3 overflow-x-auto py-2">
              {gapData.critical_path.map((node, index) => {
                const isWeak = node.is_weak;
                const isTarget = node.name === target;

                return (
                  <React.Fragment key={node.name}>
                    <div
                      onClick={() => onSelectConcept(node.name)}
                      className={`flex-1 min-w-[190px] p-4 rounded-xl border transition-all cursor-pointer ${
                        isTarget
                          ? 'bg-accent-purple/15 border-border-accent shadow-lg shadow-purple-900/10'
                          : isWeak
                          ? 'bg-danger-bg border-danger/40 hover:border-danger'
                          : 'bg-bg-elevated border-border-subtle hover:border-border-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono text-text-muted">
                          {isTarget ? 'TARGET GOAL' : `DEPTH ${node.depth}`}
                        </span>
                        {isWeak && !isTarget && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-danger-bg text-danger border border-danger/40 font-semibold">
                            WEAK LINK
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-text-primary mt-2">{node.name}</h4>

                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-text-muted">Mastery:</span>
                          <span
                            className={`font-mono font-bold ${
                              node.confidence >= 0.7
                                ? 'text-success'
                                : node.confidence >= 0.45
                                ? 'text-warning'
                                : 'text-danger'
                            }`}
                          >
                            {Math.round(node.confidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-bg-primary rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              node.confidence >= 0.7
                                ? 'bg-success'
                                : node.confidence >= 0.45
                                ? 'bg-warning'
                                : 'bg-danger'
                            }`}
                            style={{ width: `${Math.round(node.confidence * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted">
                        <span>Difficulty: {node.difficulty}/5</span>
                        <span className="text-accent-purple font-semibold hover:underline">Inspect &rarr;</span>
                      </div>
                    </div>

                    {index < gapData.critical_path.length - 1 && (
                      <div className="hidden md:flex items-center justify-center text-text-muted">
                        <ArrowRight className="w-4 h-4 text-accent-purple" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
