import React, { useEffect, useState } from 'react';
import { TodayPlan, PlannerSlot } from '../types';
import { api } from '../services/api';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Coffee,
  Play,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface Props {
  onLaunchQuiz: (conceptName: string) => void;
  onSelectConcept: (conceptName: string) => void;
}

export const PlannerPage: React.FC<Props> = ({ onLaunchQuiz, onSelectConcept }) => {
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await api.getPlannerToday();
      setPlan(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleCompleteSlot = async (slot: PlannerSlot) => {
    if (!slot.concept_name) return;
    try {
      setCompletingId(slot.id);
      await api.completeRevision(slot.concept_name);
      if (plan) {
        setPlan({
          ...plan,
          slots: plan.slots.map((s) => (s.id === slot.id ? { ...s, completed: true } : s)),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-semibold border border-border-accent">
              Spaced Repetition Scheduler
            </span>
            <span className="text-xs text-text-muted">20-Minute Focus Slots + 5-Minute Consolidation Breaks</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary mt-1">
            Today's Revision Schedule ({plan?.date || new Date().toISOString().split('T')[0]})
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Algorithmically generated from top opportunity scores, targeting high forgetting probability and critical graph bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-text-muted font-mono">Total Study Plan</p>
            <p className="text-base font-extrabold text-accent-purple font-mono">
              {plan?.total_study_minutes ?? 80} mins
            </p>
          </div>
        </div>
      </div>

      {loading && !plan ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-mono">Optimizing 20-minute cognitive slots...</p>
        </div>
      ) : plan ? (
        <div className="space-y-4">
          {plan.slots.map((slot, index) => {
            const isBreak = slot.type === 'BREAK';

            if (isBreak) {
              return (
                <div
                  key={slot.id}
                  className="flex items-center gap-4 px-5 py-3 rounded-xl bg-bg-elevated/70 border border-border-subtle text-xs text-text-secondary ml-6"
                >
                  <Coffee className="w-4 h-4 text-success" />
                  <span className="font-mono text-[11px] text-text-muted">
                    {slot.time_start} - {slot.time_end} ({slot.duration_minutes}m)
                  </span>
                  <span className="font-semibold text-text-primary">{slot.description}</span>
                  <span className="text-[10px] text-text-muted italic hidden md:inline ml-auto">
                    {slot.why}
                  </span>
                </div>
              );
            }

            const badgeColor =
              slot.badge === 'BOTTLENECK'
                ? 'bg-danger-bg text-danger border-danger/40'
                : slot.badge === 'HIGH RISK'
                ? 'bg-warning-bg text-warning border-warning/40'
                : 'bg-accent-purple/15 text-accent-purple border-border-accent';

            return (
              <div
                key={slot.id}
                className={`p-5 rounded-2xl border transition-all ${
                  slot.completed
                    ? 'bg-bg-elevated/50 border-border-subtle opacity-70'
                    : 'bg-bg-surface border-border-subtle hover:border-border-accent shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-purple/15 border border-border-accent flex flex-col items-center justify-center font-mono text-accent-purple shrink-0">
                      <span className="text-[10px]">#{index + 1}</span>
                      <span className="text-[10px] font-bold">20m</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {slot.badge}
                        </span>
                        <span className="text-xs font-mono text-text-muted">
                          {slot.time_start} - {slot.time_end}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-text-primary mt-1 flex items-center gap-2">
                        {slot.concept_name}
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">{slot.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {slot.concept_name && (
                      <button
                        onClick={() => onLaunchQuiz(slot.concept_name!)}
                        className="px-3 py-1.5 rounded-xl bg-accent-purple/15 hover:bg-accent-purple text-accent-purple hover:text-white text-xs font-semibold border border-border-accent transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Take Quiz
                      </button>
                    )}

                    <button
                      onClick={() => handleCompleteSlot(slot)}
                      disabled={slot.completed || completingId === slot.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        slot.completed
                          ? 'bg-success-bg text-success border border-success/40 cursor-default'
                          : 'bg-bg-elevated hover:bg-bg-surface text-text-primary border border-border-subtle'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {slot.completed ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <span className="font-semibold text-text-primary">Why this slot:</span> {slot.why}
                  </span>
                  {slot.concept_name && (
                    <button
                      onClick={() => onSelectConcept(slot.concept_name!)}
                      className="text-accent-purple hover:underline shrink-0 ml-2 cursor-pointer"
                    >
                      Graph details &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
