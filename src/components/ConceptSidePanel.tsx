import React, { useEffect, useState } from 'react';
import { ConceptDetailState } from '../types';
import { api } from '../services/api';
import {
  X,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface Props {
  conceptName: string | null;
  onClose: () => void;
  onLaunchQuiz: (conceptName: string) => void;
  onRevisionSuccess?: () => void;
  onSelectConcept: (conceptName: string) => void;
}

export const ConceptSidePanel: React.FC<Props> = ({
  conceptName,
  onClose,
  onLaunchQuiz,
  onRevisionSuccess,
  onSelectConcept,
}) => {
  const { isDark } = useTheme();
  const [data, setData] = useState<ConceptDetailState | null>(null);
  const [loading, setLoading] = useState(false);
  const [revising, setRevising] = useState(false);
  const [revisedSuccess, setRevisedSuccess] = useState(false);

  useEffect(() => {
    if (!conceptName) {
      setData(null);
      return;
    }
    const loadState = async () => {
      try {
        setLoading(true);
        setRevisedSuccess(false);
        const state = await api.getConceptState(conceptName);
        setData(state);
      } catch (err) {
        console.error('Failed to load concept state:', err);
      } finally {
        setLoading(false);
      }
    };
    loadState();
  }, [conceptName]);

  if (!conceptName) return null;

  const handleMarkRevised = async () => {
    if (!data) return;
    try {
      setRevising(true);
      await api.completeRevision(data.concept.name);
      setRevisedSuccess(true);
      // reload updated state
      const updated = await api.getConceptState(data.concept.name);
      setData(updated);
      if (onRevisionSuccess) onRevisionSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setRevising(false);
    }
  };

  const c = data?.concept;
  const confBreakdown = data?.confidence_breakdown;
  const forgettingBreakdown = data?.forgetting_breakdown;
  const bottleneckBreakdown = data?.bottleneck_breakdown;

  // Chart data for Confidence "Why X%?" breakdown
  const factorChartData = confBreakdown
    ? [
        {
          factor: 'Quiz Accuracy',
          raw: Math.round(confBreakdown.quiz * 100),
          weight: '30%',
          fill: isDark ? '#8b5cf6' : '#7e22ce',
          desc: 'Verified test score',
        },
        {
          factor: 'Revision Freq',
          raw: Math.round(confBreakdown.revision_freq * 100),
          weight: '20%',
          fill: isDark ? '#a855f7' : '#9333ea',
          desc: 'Repetition cycles',
        },
        {
          factor: 'Recency',
          raw: Math.round(confBreakdown.recency * 100),
          weight: '15%',
          fill: isDark ? '#c084fc' : '#a855f7',
          desc: 'Days elapsed decay',
        },
        {
          factor: 'Practical Usage',
          raw: Math.round(confBreakdown.practical_usage * 100),
          weight: '20%',
          fill: isDark ? '#e879f9' : '#c084fc',
          desc: 'Notes & Q&A queries',
        },
        {
          factor: 'Activity Depth',
          raw: Math.round(confBreakdown.learning_activity * 100),
          weight: '15%',
          fill: isDark ? '#f472b6' : '#db2777',
          desc: 'Session engagement',
        },
      ]
    : [];

  const confidencePct = c ? Math.round(c.confidence * 100) : 0;
  const riskPct = c ? Math.round(c.forgetting_risk * 100) : 0;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-bg-surface/95 backdrop-blur-xl border-l border-border-subtle shadow-2xl z-40 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-border-subtle flex items-start justify-between bg-bg-surface">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-mono border border-border-accent">
              {c?.domain || 'Knowledge Node'}
            </span>
            {c?.is_bottleneck && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-danger-bg text-danger font-semibold border border-danger/40 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-danger" />
                Active Bottleneck
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-text-primary mt-1.5 flex items-center gap-2">
            {conceptName}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-text-secondary">
        {loading && !c ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs">Computing state across semantic graph...</p>
          </div>
        ) : (
          <>
            {/* Description */}
            <p className="text-xs text-text-secondary leading-relaxed bg-bg-elevated p-3 rounded-xl border border-border-subtle">
              {c?.description}
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Verified Mastery</span>
                  <span className="font-mono text-accent-purple font-bold">{confidencePct}%</span>
                </div>
                <div className="w-full bg-bg-elevated rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      confidencePct >= 70
                        ? 'bg-emerald-500'
                        : confidencePct >= 45
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
                <div className="text-[10px] text-text-muted mt-1 flex justify-between">
                  <span>Formula confidence</span>
                  <span>{confidencePct < 40 ? 'Fragile' : confidencePct < 70 ? 'Developing' : 'Mastered'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Forgetting Risk</span>
                  <span className="font-mono text-warning font-bold">{riskPct}%</span>
                </div>
                <div className="w-full bg-bg-elevated rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      riskPct > 60 ? 'bg-danger' : riskPct > 35 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${riskPct}%` }}
                  />
                </div>
                <div className="text-[10px] text-text-muted mt-1 flex justify-between">
                  <span>Stability: {c?.stability ?? 7} days</span>
                  <span>Probability</span>
                </div>
              </div>
            </div>

            {/* WHY X% BREAKDOWN (Pure mathematical transparency) */}
            <div className="p-4 rounded-xl bg-bg-surface border border-border-accent space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-purple" />
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                    Why {confidencePct}% Mastery?
                  </h3>
                </div>
                <span className="text-[10px] text-accent-purple font-mono">Pure Intelligence Layer</span>
              </div>
              <p className="text-[11px] text-text-secondary">
                Calculated from <span className="text-text-primary font-mono">0.30*quiz + 0.20*revisions + 0.15*recency + 0.20*usage + 0.15*activity</span>:
              </p>

              <div className="h-36 w-full -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={factorChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="factor"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 10 }}
                      width={90}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-bg-surface border border-border-accent p-2 rounded-lg text-xs shadow-xl text-text-primary">
                            <p className="font-semibold text-text-primary">{d.factor}</p>
                            <p className="text-accent-purple">Factor score: {d.raw}%</p>
                            <p className="text-text-muted text-[10px]">Model weight: {d.weight} ({d.desc})</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="raw" radius={[0, 4, 4, 0]}>
                      {factorChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Factors list values */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-[11px]">
                <div className="flex justify-between text-text-secondary">
                  <span>Quiz Accuracy:</span>
                  <span className="font-mono text-accent-purple font-semibold">{Math.round((confBreakdown?.quiz ?? 0) * 100)}%</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Revisions (count):</span>
                  <span className="font-mono text-accent-purple font-semibold">{c?.n_revisions ?? 0}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Last Revised:</span>
                  <span className="font-mono text-accent-purple font-semibold">{forgettingBreakdown?.days_since_revision ?? 0}d ago</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Usage & Notes:</span>
                  <span className="font-mono text-accent-purple font-semibold">{c?.usage_count ?? 0} times</span>
                </div>
              </div>
            </div>

            {/* BOTTLENECK ANALYSIS IF APPLICABLE */}
            {bottleneckBreakdown && bottleneckBreakdown.downstream_dependency_count > 0 && (
              <div
                className={`p-3.5 rounded-xl border ${
                  c?.is_bottleneck
                    ? 'bg-danger-bg border-danger/40 text-danger'
                    : 'bg-bg-surface border-border-subtle text-text-secondary'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className={`w-3.5 h-3.5 ${c?.is_bottleneck ? 'text-danger' : 'text-text-muted'}`} />
                    Graph Dependency Impact
                  </span>
                  <span className="font-mono text-[11px] font-bold">
                    Score: {c?.bottleneck_score ?? 0}
                  </span>
                </div>
                <p className="text-[11px] mt-1.5 opacity-90">
                  Blocks <span className="font-bold underline">{bottleneckBreakdown.downstream_dependency_count} downstream topics</span>:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {bottleneckBreakdown.downstream_concepts.map((concept) => (
                    <button
                      key={concept}
                      onClick={() => onSelectConcept(concept)}
                      className="px-2 py-0.5 rounded bg-bg-elevated hover:bg-accent-purple/15 border border-border-subtle hover:border-border-accent text-[10px] text-text-primary transition-colors cursor-pointer"
                    >
                      {concept} &rarr;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PREREQUISITES & DEPENDENTS */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent-purple" />
                Structural Relationships
              </h4>

              {/* Prerequisites */}
              <div>
                <span className="text-[11px] text-text-secondary">Prerequisites ({data?.prerequisites.length ?? 0}):</span>
                <div className="mt-1 space-y-1.5">
                  {data?.prerequisites.length === 0 ? (
                    <span className="text-xs text-text-muted italic">Foundational entry point (no upstream prerequisites)</span>
                  ) : (
                    data?.prerequisites.map((p) => (
                      <div
                        key={p.name}
                        onClick={() => onSelectConcept(p.name)}
                        className="flex items-center justify-between p-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-border-accent cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-medium text-text-primary">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted font-mono">
                            {Math.round(p.confidence * 100)}%
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.confidence >= 0.7
                                ? 'bg-emerald-500'
                                : p.confidence >= 0.45
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Downstream */}
              <div>
                <span className="text-[11px] text-text-secondary">Directly Unblocks ({data?.dependents.length ?? 0}):</span>
                <div className="mt-1 space-y-1.5">
                  {data?.dependents.length === 0 ? (
                    <span className="text-xs text-text-muted italic">Terminal leaf application concept</span>
                  ) : (
                    data?.dependents.map((d) => (
                      <div
                        key={d.name}
                        onClick={() => onSelectConcept(d.name)}
                        className="flex items-center justify-between p-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-border-accent cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-medium text-text-primary">{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted font-mono">
                            {Math.round(d.confidence * 100)}%
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              d.confidence >= 0.7
                                ? 'bg-emerald-500'
                                : d.confidence >= 0.45
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-border-subtle bg-bg-surface space-y-2">
        {revisedSuccess && (
          <div className="p-2 rounded-lg bg-success-bg border border-success/40 text-success text-xs flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-success" />
            Spaced revision logged! Stability increased to {data?.concept.stability} days.
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onLaunchQuiz(conceptName)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Verify with Diagnostic Quiz
          </button>
          <button
            onClick={handleMarkRevised}
            disabled={revising}
            className="py-2.5 px-3 rounded-xl bg-bg-elevated hover:bg-bg-surface text-text-primary text-xs font-semibold flex items-center justify-center gap-1.5 border border-border-subtle transition-colors cursor-pointer"
            title="Mark Spaced Revision Completed"
          >
            <Clock className={`w-3.5 h-3.5 ${revising ? 'animate-spin' : ''}`} />
            Log Revision
          </button>
        </div>
      </div>
    </div>
  );
};
