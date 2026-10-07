import React, { useEffect, useState } from 'react';
import { DashboardData } from '../types';
import { api } from '../services/api';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  BrainCircuit,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onNavigateToQuiz: (conceptName: string) => void;
  onNavigateToConcept: (conceptName: string) => void;
  onNavigateToTab: (tabId: any) => void;
}

export const DashboardPage: React.FC<Props> = ({
  onNavigateToQuiz,
  onNavigateToConcept,
  onNavigateToTab,
}) => {
  const { isDark } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-text-secondary">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-mono">Aggregating live knowledge metrics across database stores...</p>
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Banner Notice: Brain-inspired semantic knowledge graph & forgetting probability estimation */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-purple/15 via-indigo-600/10 to-bg-surface border border-border-accent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-semibold border border-border-accent">
              Personal Learning Intelligence
            </span>
            <span className="text-xs text-text-muted">Continuous Loop: Learn &rarr; Model &rarr; Predict &rarr; Recommend</span>
          </div>
          <p className="text-xs text-text-secondary">
            Brain-inspired visualization of a semantic knowledge graph that estimates forgetting probability using spaced cognitive stability decay.
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab('graph')}
          className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all shrink-0 cursor-pointer"
        >
          Explore Graph View &rarr;
        </button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>Knowledge Strength</span>
            <Activity className="w-4 h-4 text-accent-purple" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono">{m?.knowledge_strength ?? 64}%</span>
            <span className="text-xs text-success font-mono">+6% wk</span>
          </div>
          <div className="w-full bg-bg-elevated rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-accent-purple rounded-full"
              style={{ width: `${m?.knowledge_strength ?? 64}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-2">Aggregated across 15 semantic nodes</p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>Memory Risk Index</span>
            <ShieldAlert className="w-4 h-4 text-warning" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-warning font-mono">{m?.memory_risk_index ?? 33}%</span>
            <span className="text-xs text-text-muted font-mono">est. probability</span>
          </div>
          <div className="w-full bg-bg-elevated rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-warning rounded-full"
              style={{ width: `${m?.memory_risk_index ?? 33}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-2">Concepts with decay risk &gt; 55%</p>
        </div>

        {/* Metric 3: Critical Bottleneck Alert */}
        <div className="p-4 rounded-2xl bg-danger-bg border border-danger/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-danger text-xs">
            <span className="font-semibold">Active Bottlenecks</span>
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-danger font-mono">
              {m?.active_bottlenecks_count ?? 1}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/20 text-danger font-mono font-semibold">
              Attention (27%)
            </span>
          </div>
          <p className="text-[10px] text-danger/80 mt-2">
            Blocks 5 downstream concepts (Transformer, LLM, RAG)
          </p>
          <button
            onClick={() => onNavigateToQuiz('Attention')}
            className="mt-2 text-[11px] font-semibold text-danger hover:underline flex items-center gap-1 cursor-pointer"
          >
            Resolve Bottleneck &rarr;
          </button>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>Learning Habit & Retention</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-mono">{m?.learning_streak_days ?? 12}</span>
            <span className="text-xs text-orange-500 font-mono">day streak</span>
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            {m?.quizzes_taken_total ?? 19} diagnostic tests completed • {m?.retention_estimate ?? 78}% avg retention
          </p>
        </div>
      </div>

      {/* Main Two Column Section: Trend Chart & Top Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Strength & Retention Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-purple" />
                Knowledge Strength & Retention Stability
              </h3>
              <p className="text-xs text-text-muted">7-day progression computed from test verification & spaced revisions</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-accent-purple font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-purple"></span> Mastery (%)
              </span>
              <span className="flex items-center gap-1.5 text-success font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span> Retention (%)
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.strength_trend || []}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#8b5cf6' : '#7e22ce'} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={isDark ? '#8b5cf6' : '#7e22ce'} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#10b981' : '#059669'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isDark ? '#10b981' : '#059669'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                />
                <YAxis
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  domain={[40, 100]}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                />
                <Tooltip
                  content={({ payload, label }) => {
                    if (!payload || !payload.length) return null;
                    return (
                      <div className="bg-bg-surface border border-border-accent p-2.5 rounded-xl shadow-xl text-xs font-mono text-text-primary">
                        <p className="font-semibold text-text-primary">{label}</p>
                        <p className="text-accent-purple">Mastery: {payload[0]?.value}%</p>
                        <p className="text-success">Retention: {payload[1]?.value}%</p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="strength"
                  stroke={isDark ? '#8b5cf6' : '#7e22ce'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purpleGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="retention"
                  stroke={isDark ? '#10b981' : '#059669'}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#emeraldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Next Best Actions (with the Non-negotiable "Why?" Checklist) */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-purple" />
                Recommended Actions
              </h3>
              <span className="text-[10px] font-mono text-accent-purple">Ranked by Opportunity</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Actions calculated via weighted opportunity score with per-factor contributions.
            </p>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {data?.recommended_actions.slice(0, 3).map((action) => (
              <div
                key={action.concept_name}
                className="p-3 rounded-xl bg-bg-elevated border border-border-subtle hover:border-border-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-purple/15 text-accent-purple border border-border-accent">
                      {action.suggested_action === 'FOUNDATION_STUDY' ? 'Foundation Study' : 'Diagnostic Quiz'}
                    </span>
                    <h4 className="text-xs font-bold text-text-primary mt-1">
                      {action.concept_name}
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateToQuiz(action.concept_name)}
                    className="p-1.5 rounded-lg bg-accent-purple/15 hover:bg-accent-purple text-accent-purple hover:text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Start &rarr;
                  </button>
                </div>

                {/* The "Why?" checkmark list */}
                <div className="mt-2 space-y-1">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-text-muted">Why recommended:</div>
                  {action.why_list.slice(0, 2).map((why, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                      <CheckCircle2 className="w-3 h-3 text-success mt-0.5 shrink-0" />
                      <span>{why}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateToTab('planner')}
            className="w-full py-2 rounded-xl bg-bg-elevated hover:bg-bg-surface border border-border-subtle text-text-primary text-xs font-semibold transition-colors text-center cursor-pointer"
          >
            View Full Day Plan (20m Slots) &rarr;
          </button>
        </div>
      </div>

      {/* Bottom Grid: At-Risk Concepts & Active Graph Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At-Risk Concepts Table */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              At-Risk Concepts (Memory Decay)
            </h3>
            <span className="text-[10px] text-text-muted font-mono">estimates forgetting probability</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted font-mono text-[10px]">
                  <th className="pb-2">Concept</th>
                  <th className="pb-2">Domain</th>
                  <th className="pb-2">Forgetting Risk</th>
                  <th className="pb-2">Stability</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data?.at_risk_concepts.map((item) => (
                  <tr key={item.name} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="py-2.5 font-semibold text-text-primary">{item.name}</td>
                    <td className="py-2.5 text-text-secondary">{item.domain}</td>
                    <td className="py-2.5 font-mono">
                      <span className="text-danger font-bold">{Math.round(item.forgetting_risk * 100)}%</span>
                    </td>
                    <td className="py-2.5 text-text-secondary font-mono">{item.stability_days} days</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onNavigateToQuiz(item.name)}
                        className="px-2 py-1 rounded bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple text-[10px] font-semibold border border-border-accent transition-colors cursor-pointer"
                      >
                        Reinforce
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Bottlenecks in the Graph */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-purple" />
              Critical Knowledge Bottlenecks
            </h3>
            <span className="text-[10px] text-accent-purple font-mono">Traversed via Graph Dependencies</span>
          </div>

          <div className="space-y-3">
            {data?.top_bottlenecks.map((b) => (
              <div
                key={b.concept_name}
                className="p-3.5 rounded-xl bg-bg-elevated border border-border-accent flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-text-primary">{b.concept_name}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-danger-bg text-danger border border-danger/40">
                        Bottleneck Score: {b.bottleneck_score}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">{b.recommendation}</p>
                  </div>
                  <button
                    onClick={() => onNavigateToQuiz(b.concept_name)}
                    className="px-2.5 py-1.5 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white text-[11px] font-semibold shadow-md transition-colors shrink-0 cursor-pointer"
                  >
                    Unblock Now &rarr;
                  </button>
                </div>
                <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted">
                  <span>Downstream dependents: <strong className="text-text-primary">{b.downstream_count}</strong> topics</span>
                  <span>Verified mastery: <strong className="text-accent-purple">{Math.round(b.confidence * 100)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
