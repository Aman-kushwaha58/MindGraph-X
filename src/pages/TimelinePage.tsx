import React, { useEffect, useState } from 'react';
import { TimelineEvent } from '../types';
import { api } from '../services/api';
import {
  Clock,
  Sparkles,
  HelpCircle,
  FileText,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

interface Props {
  onSelectConcept: (conceptName: string) => void;
}

export const TimelinePage: React.FC<Props> = ({ onSelectConcept }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.getTimeline();
      setEvents(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const formatEventDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'quiz_completed':
        return <HelpCircle className="w-4 h-4 text-purple-400" />;
      case 'revision_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'document_ingested':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'bottleneck_cleared':
        return <TrendingUp className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-text-muted" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-semibold border border-border-accent">
              Audit Trail & Evolution Log
            </span>
            <span className="text-xs text-text-muted">PostgreSQL Event Stream</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary mt-1">
            Learning Timeline & Knowledge State Transitions
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Immutable log of all diagnostic evaluations, spaced revisions, and graph metric shifts.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-mono text-text-muted">Total Logged Events</p>
          <p className="text-base font-extrabold text-accent-purple font-mono">{events.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-mono">Loading event history from PostgreSQL...</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
          {events.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-bg-surface border-2 border-accent-purple flex items-center justify-center group-hover:scale-125 transition-transform" />

              {/* Event Card */}
              <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle hover:border-border-accent transition-all space-y-2 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    {getEventIcon(evt.type)}
                    <h3 className="text-xs font-bold text-text-primary">{evt.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    {formatEventDate(evt.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">{evt.description}</p>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border-subtle gap-2">
                  {evt.concept_name && (
                    <button
                      onClick={() => onSelectConcept(evt.concept_name!)}
                      className="text-[11px] font-mono text-accent-purple hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Concept: {evt.concept_name}</span> &rarr;
                    </button>
                  )}

                  {evt.metrics_delta && (
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      {evt.metrics_delta.confidence_delta !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded border ${
                            evt.metrics_delta.confidence_delta >= 0
                              ? 'bg-success-bg text-success border-success/40'
                              : 'bg-danger-bg text-danger border-danger/40'
                          }`}
                        >
                          Confidence: {evt.metrics_delta.confidence_delta >= 0 ? '+' : ''}
                          {Math.round(evt.metrics_delta.confidence_delta * 100)}%
                        </span>
                      )}
                      {evt.metrics_delta.risk_delta !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded border ${
                            evt.metrics_delta.risk_delta <= 0
                              ? 'bg-accent-purple/15 text-accent-purple border-border-accent'
                              : 'bg-warning-bg text-warning border-warning/40'
                          }`}
                        >
                          Risk: {evt.metrics_delta.risk_delta > 0 ? '+' : ''}
                          {Math.round(evt.metrics_delta.risk_delta * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
