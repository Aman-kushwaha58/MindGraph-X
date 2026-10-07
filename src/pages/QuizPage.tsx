import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QuizQuestion, ConceptQuizResult, MultiConceptQuizResponse } from '../types';
import { api } from '../services/api';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Check,
  Award,
  Calendar,
  Layers,
  Clock,
  BookOpen,
} from 'lucide-react';

interface Props {
  conceptName: string;
  activeDocId?: string | null;
  activeDocTitle?: string | null;
  onSelectConceptName: (name: string) => void;
  onNavigateToGraph: () => void;
  onNavigateToPlanner: () => void;
  onRefreshGraph: () => void;
}

export const QuizPage: React.FC<Props> = ({
  conceptName,
  activeDocId,
  activeDocTitle,
  onSelectConceptName,
  onNavigateToGraph,
  onNavigateToPlanner,
  onRefreshGraph,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultResponse, setResultResponse] = useState<MultiConceptQuizResponse | null>(null);
  const [activeConceptFilter, setActiveConceptFilter] = useState<string>('ALL');
  const [scheduledConcepts, setScheduledConcepts] = useState<Record<string, boolean>>({});

  const availableConcepts = [
    'Attention',
    'Transformer',
    'RAG',
    'Linear Algebra',
    'Neural Networks',
    'Backpropagation',
    'Vector Search',
    'Embeddings',
    'LLM',
  ];

  // Load questions either for active document or target concept
  const loadQuiz = async () => {
    try {
      setLoading(true);
      setResultResponse(null);
      setUserAnswers({});
      setCurrentIdx(0);
      setActiveConceptFilter('ALL');

      if (activeDocId) {
        // Document-scoped multi-concept quiz
        const docQuiz = await api.generateQuizForDocument(activeDocId);
        setQuestions(docQuiz.questions);
      } else {
        // Concept-scoped quiz
        const res = await api.generateQuiz(conceptName || 'Attention');
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [conceptName, activeDocId]);

  // Unique concepts present in this quiz
  const conceptsInQuiz = Array.from(new Set(questions.map((q) => q.concept_name)));

  // Filter questions if user selects a specific concept tab
  const displayedQuestions =
    activeConceptFilter === 'ALL'
      ? questions
      : questions.filter((q) => q.concept_name === activeConceptFilter);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (questions.length === 0) return;
    try {
      setIsSubmitting(true);
      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_option_index: userAnswers[q.id] ?? -1,
        concept_name: q.concept_name,
      }));

      const res = await api.submitQuiz({
        concept_name: activeDocId ? undefined : conceptName || 'Attention',
        doc_id: activeDocId || undefined,
        answers: answersPayload,
        duration_seconds: 75,
      });

      setResultResponse(res);
      onRefreshGraph();

      // Confetti celebration if scored well
      const avgAccuracy =
        res.results.reduce((acc, r) => acc + r.accuracy, 0) / Math.max(1, res.results.length);
      if (avgAccuracy >= 0.5) {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#38bdf8', '#10b981', '#f59e0b'],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToPlan = async (cName: string) => {
    try {
      await api.addToRevisionPlan(cName);
      setScheduledConcepts((prev) => ({ ...prev, [cName]: true }));
    } catch (e) {
      console.error(e);
    }
  };

  const answeredCount = Object.keys(userAnswers).length;
  const currentQ = displayedQuestions[currentIdx];

  const formatPredictedDate = (isoStr: string) => {
    if (!isoStr) return 'soon';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-semibold border border-border-accent">
              {activeDocId ? 'Document Verification Quiz' : 'Concept Mastery Diagnostic'}
            </span>
            <span className="text-xs text-text-muted">
              {activeDocId ? `Source: ${activeDocTitle || 'Uploaded Paper'}` : 'Grounded Questions'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-text-primary mt-1">
            {activeDocId ? `Verification Quiz: ${activeDocTitle}` : `Diagnostic Mastery Test: ${conceptName}`}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Test answers immediately recompute confidence, update cognitive stability, and predict your safe revision window.
          </p>
        </div>

        {/* Change topic selector if not currently tied to a specific uploaded document */}
        {!activeDocId && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className="text-xs text-text-muted font-mono">Topic:</span>
            <select
              value={conceptName}
              onChange={(e) => onSelectConceptName(e.target.value)}
              className="px-3 py-2 bg-bg-elevated border border-border-accent rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-accent-purple cursor-pointer"
            >
              {availableConcepts.map((c) => (
                <option key={c} value={c}>
                  {c} {c === 'Attention' ? '(Critical Bottleneck)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-mono">Generating schema-validated diagnostic questions from source chunks...</p>
        </div>
      ) : resultResponse ? (
        /* ========================================================
           KEY SCREEN: FORGETTING PREDICTIONS & BEFORE/AFTER STATE
           ======================================================== */
        <div className="space-y-6 animate-fade-in">
          {/* Main Success Hero Header */}
          <div className="p-6 rounded-3xl bg-bg-surface border border-border-accent shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-success font-semibold text-xs">
                  <Award className="w-4 h-4" />
                  Closed Learning Loop Executed
                </div>
                <h3 className="text-2xl font-black text-text-primary mt-1">
                  Knowledge State Evolution & Forgetting Predictions
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Mastery confidence updated in semantic graph. Forgetting probabilities and safe revision windows computed for{' '}
                  <strong className="text-text-primary">{resultResponse.results.length} concept(s)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={loadQuiz}
                  className="px-3.5 py-2 rounded-xl bg-bg-elevated hover:bg-bg-surface text-text-primary text-xs font-semibold border border-border-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake
                </button>
                <button
                  onClick={onNavigateToGraph}
                  className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Inspect in Graph &rarr;
                </button>
              </div>
            </div>

            {/* Per Concept Result Cards (Requirement 6) */}
            <div className="space-y-3.5 pt-2">
              {resultResponse.results.map((res) => {
                const confBeforePct = Math.round(res.confidence_before * 100);
                const confAfterPct = Math.round(res.confidence_after * 100);
                const confGain = confAfterPct - confBeforePct;
                const isScheduled = scheduledConcepts[res.concept];

                return (
                  <div
                    key={res.concept}
                    className="p-5 rounded-2xl bg-bg-surface border border-border-accent shadow-lg space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-text-primary">{res.concept}</h4>
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                              res.risk_level === 'HIGH'
                                ? 'bg-danger-bg text-danger border-danger/40'
                                : res.risk_level === 'MEDIUM'
                                ? 'bg-warning-bg text-warning border-warning/40'
                                : 'bg-success-bg text-success border-success/40'
                            }`}
                          >
                            Score: {res.score}/{res.total} ({Math.round(res.accuracy * 100)}%)
                          </span>
                        </div>
                      </div>

                      {/* Add to Revision Plan CTA Button */}
                      <button
                        onClick={() => handleAddToPlan(res.concept)}
                        disabled={isScheduled}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isScheduled
                            ? 'bg-success-bg text-success border border-success/40 cursor-default'
                            : 'bg-accent-purple hover:bg-accent-purple/90 text-white shadow-md shadow-purple-600/30'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {isScheduled ? 'Scheduled on Planner' : 'Add to Revision Plan'}
                      </button>
                    </div>

                    {/* Animated / Styled Before vs After Progress Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-elevated p-3.5 rounded-xl border border-border-subtle">
                      {/* Mastery Shift */}
                      <div>
                        <div className="flex justify-between text-xs text-text-secondary">
                          <span>Verified Mastery Shift:</span>
                          <span className="font-mono text-text-primary">
                            <span className="text-text-muted line-through mr-1.5">{confBeforePct}%</span>
                            <span className="font-bold text-success">{confAfterPct}%</span>
                            {confGain > 0 && (
                              <span className="text-success font-bold ml-1">
                                (+{confGain}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-bg-surface rounded-full h-2 mt-2 overflow-hidden flex border border-border-subtle">
                          <div
                            className="bg-accent-purple/40 h-full"
                            style={{ width: `${confBeforePct}%` }}
                          />
                          {confGain > 0 && (
                            <div
                              className="bg-emerald-500 h-full animate-pulse"
                              style={{ width: `${confGain}%` }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Memory Stability & Window */}
                      <div>
                        <div className="flex justify-between text-xs text-text-secondary">
                          <span>Safe Revision Window:</span>
                          <span className="font-mono text-accent-purple font-bold">
                            {res.safe_days} days (Stability: {res.stability_days}d)
                          </span>
                        </div>
                        <div className="w-full bg-bg-surface rounded-full h-2 mt-2 overflow-hidden border border-border-subtle">
                          <div
                            className="bg-accent-purple h-full rounded-full"
                            style={{ width: `${Math.min(100, res.safe_days * 7)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Requirement 6: Plain-language line */}
                    <div className="p-3 rounded-xl bg-accent-purple/15 border border-border-accent text-xs text-text-secondary flex items-start gap-2">
                      <Clock className="w-4 h-4 text-accent-purple mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium leading-relaxed text-text-primary">
                          {res.forgetting_prediction_text}
                        </p>
                        <p className="text-[10px] text-text-muted mt-1">
                          Calculated from stability decay equation: <span className="font-mono text-text-primary">t = -stability * ln(1 - 0.50)</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Explanations Review */}
          <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent-purple" />
              Detailed Question Feedback & Chunk Grounding
            </h4>

            <div className="space-y-3">
              {resultResponse.questions_feedback.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    item.is_correct
                      ? 'bg-success-bg border-success/30'
                      : 'bg-danger-bg border-danger/30'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {item.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                    )}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-purple/15 text-accent-purple border border-border-accent">
                          {item.concept}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted">Question {idx + 1}</span>
                      </div>
                      <p className="text-xs font-bold text-text-primary">{item.question}</p>
                      <div className="text-[11px] text-text-secondary flex flex-wrap gap-x-4">
                        <span>
                          Your answer:{' '}
                          <strong className={item.is_correct ? 'text-success' : 'text-danger'}>
                            {item.user_answer}
                          </strong>
                        </span>
                        {!item.is_correct && (
                          <span>
                            Correct:{' '}
                            <strong className="text-success">{item.correct_answer}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-1 bg-bg-surface p-2.5 rounded-lg border border-border-subtle leading-relaxed">
                        <span className="font-semibold text-text-primary">Grounding Explanation:</span>{' '}
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Updated Graph Bottlenecks Section */}
          {resultResponse.bottlenecks && resultResponse.bottlenecks.length > 0 && (
            <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Updated Bottleneck Rankings Post-Quiz
                </h4>
                <span className="text-[11px] font-mono text-text-muted">
                  Formula: (1 - conf) &times; downstream &times; mean_importance
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {resultResponse.bottlenecks.slice(0, 3).map((b) => (
                  <div
                    key={b.concept_name}
                    className="p-3.5 rounded-xl bg-bg-elevated border border-border-subtle space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">{b.concept_name}</span>
                      <span className="text-[10px] font-mono font-bold text-warning bg-warning-bg px-2 py-0.5 rounded border border-warning/40">
                        Score: {b.bottleneck_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      Mastery: <span className="font-mono text-text-primary">{Math.round(b.confidence * 100)}%</span> &bull; Blocks{' '}
                      <span className="font-mono text-accent-purple">{b.downstream_count} downstream</span>
                    </div>
                    <p className="text-[10px] text-text-muted line-clamp-2">{b.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Updated Next Best Actions / Recommendations */}
          {resultResponse.recommendations && resultResponse.recommendations.length > 0 && (
            <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-purple" />
                  Updated Recommended Next Steps
                </h4>
                <button
                  onClick={onNavigateToPlanner}
                  className="text-xs text-accent-purple hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Open Revision Planner &rarr;
                </button>
              </div>
              <div className="space-y-2.5">
                {resultResponse.recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.concept_name}
                    className="p-3 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">{rec.concept_name}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold border ${
                            rec.priority_tier === 'URGENT'
                              ? 'bg-danger-bg text-danger border-danger/40'
                              : rec.priority_tier === 'HIGH'
                              ? 'bg-warning-bg text-warning border-warning/40'
                              : 'bg-accent-purple/15 text-accent-purple border-border-accent'
                          }`}
                        >
                          {rec.priority_tier}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {rec.suggested_action.replace('_', ' ')} (~{rec.estimated_minutes}m)
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted">{rec.why_list[0] || 'High priority learning opportunity.'}</p>
                    </div>
                    <button
                      onClick={() => handleAddToPlan(rec.concept_name)}
                      disabled={scheduledConcepts[rec.concept_name]}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                        scheduledConcepts[rec.concept_name]
                          ? 'bg-success-bg text-success border border-success/40 cursor-default'
                          : 'bg-bg-surface hover:bg-bg-elevated text-text-primary border border-border-subtle'
                      }`}
                    >
                      {scheduledConcepts[rec.concept_name] ? 'Scheduled' : '+ Plan Slot'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : questions.length > 0 && currentQ ? (
        /* ========================================================
           ACTIVE TEST TAKING INTERFACE
           ======================================================== */
        <div className="space-y-6">
          {/* Concept Filter Tabs if multiple concepts exist */}
          {conceptsInQuiz.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-mono text-text-muted shrink-0">Filter:</span>
              <button
                onClick={() => {
                  setActiveConceptFilter('ALL');
                  setCurrentIdx(0);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  activeConceptFilter === 'ALL'
                    ? 'bg-accent-purple text-white font-semibold'
                    : 'bg-bg-surface text-text-muted hover:text-text-primary border border-border-subtle'
                }`}
              >
                All ({questions.length})
              </button>
              {conceptsInQuiz.map((cName) => (
                <button
                  key={cName}
                  onClick={() => {
                    setActiveConceptFilter(cName);
                    setCurrentIdx(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    activeConceptFilter === cName
                      ? 'bg-accent-purple text-white font-semibold'
                      : 'bg-bg-surface text-text-muted hover:text-text-primary border border-border-subtle'
                  }`}
                >
                  {cName} ({questions.filter((q) => q.concept_name === cName).length})
                </button>
              ))}
            </div>
          )}

          {/* Stepper Status Bar */}
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-accent-purple/15 text-accent-purple font-mono text-[10px] border border-border-accent">
                {currentQ.concept_name}
              </span>
              <span>
                Question <strong className="text-text-primary font-mono">{currentIdx + 1}</strong> of{' '}
                <strong className="text-text-primary font-mono">{displayedQuestions.length}</strong>
              </span>
            </span>
            <span className="font-mono">
              Answered: {answeredCount} / {questions.length} total
            </span>
          </div>

          <div className="w-full bg-bg-elevated rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-accent-purple transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / displayedQuestions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="p-6 rounded-3xl bg-bg-surface border border-border-subtle shadow-xl space-y-6">
            <h3 className="text-base font-bold text-text-primary leading-snug">
              {currentIdx + 1}. {currentQ.question}
            </h3>

            {/* Options list */}
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-accent-purple/20 border-accent-purple text-text-primary shadow-md'
                        : 'bg-bg-elevated border-border-subtle text-text-secondary hover:border-border-accent hover:bg-bg-surface'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 ${
                        isSelected
                          ? 'bg-accent-purple text-white font-bold'
                          : 'bg-bg-surface border border-border-subtle text-text-muted'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="mt-0.5 leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl bg-bg-surface hover:bg-bg-elevated disabled:opacity-40 text-xs font-semibold text-text-secondary border border-border-subtle transition-colors cursor-pointer"
            >
              &larr; Previous
            </button>

            {currentIdx < displayedQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => Math.min(displayedQuestions.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-colors cursor-pointer"
              >
                Next Question &rarr;
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-purple-600/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Evaluating & Computing Predictions...' : 'Submit & Compute Forgetting Predictions'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
