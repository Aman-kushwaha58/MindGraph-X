import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  Layers,
  Code2,
  Scale,
  Calculator,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  BrainCircuit,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import {
  ExplainerMode,
  ConceptExplainerResult,
  FlashcardItem,
  FlashcardDeck,
  SocraticFeedback,
  ConceptSynthesis,
  FormulaDecoderResult,
  CodeGenerationResult,
} from '../types';

interface Props {
  onLaunchQuiz: (conceptName: string) => void;
  onSelectConcept: (conceptName: string) => void;
}

type ActiveTool = 'explainer' | 'flashcards' | 'socratic' | 'synthesizer' | 'formula' | 'code';

export const AIToolsPage: React.FC<Props> = ({ onLaunchQuiz, onSelectConcept }) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>('explainer');

  // Common Concept Picker State
  const commonConcepts = [
    'Attention',
    'FlashAttention',
    'Diffusion Models',
    'Score-Based SDE',
    'Latent Diffusion',
    'Vector Search',
    'Transformer',
    'RAG',
  ];
  const [selectedConcept, setSelectedConcept] = useState<string>('Attention');
  const [customConcept, setCustomConcept] = useState<string>('');

  // 1. Explainer State
  const [explainerMode, setExplainerMode] = useState<ExplainerMode>('analogy');
  const [explainerResult, setExplainerResult] = useState<ConceptExplainerResult | null>(null);
  const [explainerLoading, setExplainerLoading] = useState<boolean>(false);

  // 2. Flashcards State
  const [cardDeck, setCardDeck] = useState<FlashcardDeck | null>(null);
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [cardsLoading, setCardsLoading] = useState<boolean>(false);
  const [cardReviewToast, setCardReviewToast] = useState<string | null>(null);

  // 3. Socratic State
  const [socraticText, setSocraticText] = useState<string>('');
  const [socraticResult, setSocraticResult] = useState<SocraticFeedback | null>(null);
  const [socraticLoading, setSocraticLoading] = useState<boolean>(false);

  // 4. Synthesizer State
  const [conceptA, setConceptA] = useState<string>('Attention');
  const [conceptB, setConceptB] = useState<string>('FlashAttention');
  const [synthesisResult, setSynthesisResult] = useState<ConceptSynthesis | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState<boolean>(false);

  // 5. Formula Decoder State
  const formulaOptions = [
    'Scaled Dot-Product Attention',
    'Reverse-Time Diffusion SDE',
  ];
  const [selectedFormula, setSelectedFormula] = useState<string>('Scaled Dot-Product Attention');
  const [formulaResult, setFormulaResult] = useState<FormulaDecoderResult | null>(null);
  const [formulaLoading, setFormulaLoading] = useState<boolean>(false);

  // 6. Code Sandbox State
  const [codeResult, setCodeResult] = useState<CodeGenerationResult | null>(null);
  const [codeLoading, setCodeLoading] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  const effectiveConcept = customConcept.trim() || selectedConcept;

  // Initial loads
  useEffect(() => {
    handleRunExplainer();
    handleLoadFlashcards();
    handleRunFormulaDecoder();
  }, []);

  // --- Handlers ---
  const handleRunExplainer = async (overrideMode?: ExplainerMode) => {
    try {
      setExplainerLoading(true);
      const mode = overrideMode || explainerMode;
      const res = await api.explainConcept({ concept: effectiveConcept, mode });
      setExplainerResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setExplainerLoading(false);
    }
  };

  const handleLoadFlashcards = async () => {
    try {
      setCardsLoading(true);
      setIsFlipped(false);
      setCardIndex(0);
      const res = await api.generateFlashcards({ concept: effectiveConcept });
      setCardDeck(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCardsLoading(false);
    }
  };

  const handleRateCard = async (rating: 1 | 2 | 3 | 4) => {
    if (!cardDeck || !cardDeck.cards[cardIndex]) return;
    const card = cardDeck.cards[cardIndex];
    try {
      const res = await api.logCardReview({
        cardId: card.id,
        concept: effectiveConcept,
        rating,
      });
      setCardReviewToast(res.message);
      setTimeout(() => setCardReviewToast(null), 3000);
      // Advance to next card
      if (cardIndex < cardDeck.cards.length - 1) {
        setIsFlipped(false);
        setCardIndex((prev) => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunSocratic = async () => {
    if (!socraticText.trim()) return;
    try {
      setSocraticLoading(true);
      const res = await api.evaluateSocratic({
        concept: effectiveConcept,
        userExplanation: socraticText,
      });
      setSocraticResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSocraticLoading(false);
    }
  };

  const handleRunSynthesis = async () => {
    try {
      setSynthesisLoading(true);
      const res = await api.synthesizeConcepts({ conceptA, conceptB });
      setSynthesisResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSynthesisLoading(false);
    }
  };

  const handleRunFormulaDecoder = async (formulaName?: string) => {
    try {
      setFormulaLoading(true);
      const res = await api.decodeFormula({ formulaName: formulaName || selectedFormula });
      setFormulaResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setFormulaLoading(false);
    }
  };

  const handleRunCodeGenerator = async () => {
    try {
      setCodeLoading(true);
      const res = await api.generateCodeSnippet({
        concept: effectiveConcept,
        framework: 'pytorch',
      });
      setCodeResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCodeLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!codeResult) return;
    navigator.clipboard.writeText(codeResult.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const toolsList: Array<{ id: ActiveTool; label: string; icon: React.FC<{ className?: string }>; desc: string }> = [
    { id: 'explainer', label: 'Multi-Lens Explainer', icon: Lightbulb, desc: 'Analogy, first principles, ELI5 & engineering' },
    { id: 'flashcards', label: 'Active Recall Cards', icon: Layers, desc: 'Interactive 3D flashcards with stability logging' },
    { id: 'socratic', label: 'Feynman Socratic Test', icon: BrainCircuit, desc: 'Explain in your own words, AI grades rigor & gaps' },
    { id: 'synthesizer', label: 'Concept Bridge', icon: Scale, desc: 'Compare 2 concepts, evolution & trade-offs' },
    { id: 'formula', label: 'Formula Decoder', icon: Calculator, desc: 'Step-by-step tensor & variable breakdown' },
    { id: 'code', label: 'PyTorch Sandbox', icon: Code2, desc: 'Clean annotated tensor implementation snippets' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-semibold border border-border-accent">
              Cognitive Acceleration
            </span>
            <span className="text-xs text-text-muted">AI Learning Tools Suite</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary mt-1">
            Intelligent Learning & Synthesis Tools
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Break down mathematical formulations, test deep intuition with the Feynman technique, and practice active recall.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onLaunchQuiz(effectiveConcept)}
            className="px-3.5 py-1.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Verify with Quiz &rarr;
          </button>
        </div>
      </div>

      {/* Concept Selector Pill Row */}
      <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-accent-purple" />
            Select Graph Concept or Enter Custom Topic:
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Or type custom concept..."
              value={customConcept}
              onChange={(e) => setCustomConcept(e.target.value)}
              className="px-3 py-1 text-xs rounded-lg bg-bg-elevated border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple w-full sm:w-56"
            />
            {customConcept && (
              <button
                onClick={() => setCustomConcept('')}
                className="text-xs text-text-muted hover:text-text-primary cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {commonConcepts.map((c) => {
            const isSelected = selectedConcept === c && !customConcept;
            return (
              <button
                key={c}
                onClick={() => {
                  setSelectedConcept(c);
                  setCustomConcept('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent-purple text-white shadow-md shadow-purple-600/30 font-semibold'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-surface border border-border-subtle'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {toolsList.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id);
                if (t.id === 'explainer' && !explainerResult) handleRunExplainer();
                if (t.id === 'flashcards' && !cardDeck) handleLoadFlashcards();
                if (t.id === 'code' && !codeResult) handleRunCodeGenerator();
                if (t.id === 'formula' && !formulaResult) handleRunFormulaDecoder();
              }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                isActive
                  ? 'bg-accent-purple/20 border-accent-purple text-text-primary shadow-sm'
                  : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent-purple' : 'text-text-muted'}`} />
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-accent-purple"></div>}
              </div>
              <div>
                <p className={`text-xs font-bold ${isActive ? 'text-accent-purple' : 'text-text-primary'}`}>
                  {t.label}
                </p>
                <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TOOL 1: MULTI-LENS CONCEPT EXPLAINER */}
      {/* ============================================================ */}
      {activeTool === 'explainer' && (
        <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-accent-purple" />
                Multi-Lens Concept Explainer: <span className="text-accent-purple">{effectiveConcept}</span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Switch cognitive perspectives to build intuition, mathematical rigor, and engineering clarity.
              </p>
            </div>

            {/* Cognitive Lens Switcher */}
            <div className="flex items-center gap-1.5 bg-bg-elevated p-1 rounded-xl border border-border-subtle">
              {(
                [
                  { id: 'analogy', label: 'Analogy', icon: '💡' },
                  { id: 'first-principles', label: 'First Principles', icon: '🔬' },
                  { id: 'eli5', label: 'ELI5', icon: '🧒' },
                  { id: 'engineering', label: 'Engineering', icon: '💼' },
                ] as Array<{ id: ExplainerMode; label: string; icon: string }>
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setExplainerMode(m.id);
                    handleRunExplainer(m.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    explainerMode === m.id
                      ? 'bg-accent-purple text-white font-semibold shadow'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {explainerLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted">
              <div className="w-7 h-7 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono mt-3">Synthesizing {explainerMode} explanation for {effectiveConcept}...</p>
            </div>
          ) : explainerResult ? (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle text-sm leading-relaxed text-text-primary space-y-3">
                <div className="whitespace-pre-line">{explainerResult.explanation}</div>
              </div>

              {explainerResult.formulas && explainerResult.formulas.length > 0 && (
                <div className="p-4 rounded-xl bg-bg-elevated border border-border-accent space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-accent-purple font-semibold">
                    Mathematical Formulation:
                  </span>
                  <div className="space-y-1">
                    {explainerResult.formulas.map((f, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-bg-surface font-mono text-xs text-accent-purple border border-border-subtle">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explainerResult.keyTakeaways && explainerResult.keyTakeaways.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                    Core Insights & Invariants:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {explainerResult.keyTakeaways.map((t, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-secondary flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explainerResult.citations && explainerResult.citations.length > 0 && (
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
                  <span className="font-mono text-[11px]">Source Grounding: {explainerResult.citations.join(' • ')}</span>
                  <button
                    onClick={() => onSelectConcept(effectiveConcept)}
                    className="text-accent-purple hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    View in Graph &rarr;
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================ */}
      {/* TOOL 2: ACTIVE RECALL FLASHCARD DECK */}
      {/* ============================================================ */}
      {activeTool === 'flashcards' && (
        <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-purple" />
                Active Recall Deck: <span className="text-accent-purple">{effectiveConcept}</span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Practice spaced retrieval. Self-assessment updates cognitive stability in the knowledge graph.
              </p>
            </div>

            <button
              onClick={handleLoadFlashcards}
              disabled={cardsLoading}
              className="px-3 py-1.5 rounded-xl bg-bg-elevated hover:bg-bg-surface text-text-primary border border-border-subtle text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${cardsLoading ? 'animate-spin' : ''}`} />
              Regenerate Deck
            </button>
          </div>

          {cardReviewToast && (
            <div className="p-3 rounded-xl bg-success-bg border border-success/40 text-success text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>{cardReviewToast}</span>
            </div>
          )}

          {cardsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-text-muted">
              <div className="w-7 h-7 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono mt-3">Synthesizing active recall prompts for {effectiveConcept}...</p>
            </div>
          ) : cardDeck && cardDeck.cards.length > 0 ? (
            <div className="max-w-xl mx-auto space-y-5">
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs text-text-muted font-mono">
                <span>Card {cardIndex + 1} of {cardDeck.cards.length}</span>
                <span className="flex items-center gap-1 text-accent-purple font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  Spaced Repetition Active
                </span>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative min-h-[240px] p-6 rounded-2xl bg-bg-elevated border border-border-accent shadow-xl cursor-pointer hover:border-accent-purple transition-all flex flex-col justify-between select-none"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-accent-purple">
                  <span>{isFlipped ? 'ANSWER & REASONING' : 'QUESTION (PROMPT)'}</span>
                  <span className="text-text-muted">Click card to flip ↺</span>
                </div>

                <div className="py-6 flex items-center justify-center text-center">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <p className="text-base font-semibold text-text-primary leading-snug">
                        {cardDeck.cards[cardIndex]?.front}
                      </p>
                      {cardDeck.cards[cardIndex]?.hint && (
                        <p className="text-xs text-text-muted italic">
                          💡 Hint: {cardDeck.cards[cardIndex]?.hint}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 text-left">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {cardDeck.cards[cardIndex]?.back}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    {cardDeck.cards[cardIndex]?.tags?.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle text-text-secondary text-[10px] font-mono">
                        #{tag}
                      </span>
                    ))}
                  </span>
                  <span className="font-mono text-text-muted">
                    Difficulty: {cardDeck.cards[cardIndex]?.difficulty}/5
                  </span>
                </div>
              </div>

              {/* Self-Rating Feedback Buttons */}
              <div className="space-y-2">
                <p className="text-[11px] text-text-muted text-center font-mono uppercase tracking-wider">
                  How well did you recall this answer?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleRateCard(1)}
                    className="p-2.5 rounded-xl bg-danger-bg hover:bg-danger/20 border border-danger/40 text-danger text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    1 • Again
                    <span className="block text-[10px] font-normal text-danger mt-0.5">&lt; 1 day</span>
                  </button>
                  <button
                    onClick={() => handleRateCard(2)}
                    className="p-2.5 rounded-xl bg-warning-bg hover:bg-warning/20 border border-warning/40 text-warning text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    2 • Hard
                    <span className="block text-[10px] font-normal text-warning mt-0.5">2 days</span>
                  </button>
                  <button
                    onClick={() => handleRateCard(3)}
                    className="p-2.5 rounded-xl bg-accent-purple/15 hover:bg-accent-purple/25 border border-border-accent text-accent-purple text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    3 • Good
                    <span className="block text-[10px] font-normal text-accent-purple mt-0.5">5 days</span>
                  </button>
                  <button
                    onClick={() => handleRateCard(4)}
                    className="p-2.5 rounded-xl bg-success-bg hover:bg-success/20 border border-success/40 text-success text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    4 • Easy
                    <span className="block text-[10px] font-normal text-success mt-0.5">12 days</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-8">No cards available for this topic.</p>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TOOL 3: SOCRATIC FEYNMAN VALIDATOR */}
      {/* ============================================================ */}
      {activeTool === 'socratic' && (
        <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-accent-purple" />
              Socratic Feynman Interrogator: <span className="text-accent-purple">{effectiveConcept}</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Explain this concept in your own words as if teaching someone else. The AI evaluates your precision, identifies misconceptions, and challenges you with edge cases.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={4}
              value={socraticText}
              onChange={(e) => setSocraticText(e.target.value)}
              placeholder={`Explain ${effectiveConcept} in your own words (e.g. what problem does it solve, how does the math work, what are its inputs and outputs?)...`}
              className="w-full p-4 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple leading-relaxed font-sans"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted font-mono">
                {socraticText.trim().split(/\s+/).filter(Boolean).length} words written
              </span>
              <button
                onClick={handleRunSocratic}
                disabled={socraticLoading || socraticText.trim().length < 10}
                className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                {socraticLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Evaluating Rigor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Evaluate Explanation &rarr;
                  </>
                )}
              </button>
            </div>
          </div>

          {socraticResult && (
            <div className="p-5 rounded-xl bg-bg-elevated border border-border-accent space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Feynman Mastery Score:
                  </span>
                  <span className="text-lg font-mono font-extrabold text-accent-purple">
                    {socraticResult.score}/100
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-success">Clarity: {socraticResult.rubric?.clarity}%</span>
                  <span className="text-accent-purple">Rigor: {socraticResult.rubric?.rigor}%</span>
                  <span className="text-accent-purple">Completeness: {socraticResult.rubric?.completeness}%</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-bg-surface border border-border-subtle text-xs text-text-secondary leading-relaxed">
                {socraticResult.feedback}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-success-bg border border-success/30 space-y-1.5">
                  <span className="text-[11px] font-mono text-success font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Strengths & Solid Intuition:
                  </span>
                  <ul className="space-y-1 text-text-secondary pl-4 list-disc text-[11px]">
                    {socraticResult.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-danger-bg border border-danger/30 space-y-1.5">
                  <span className="text-[11px] font-mono text-danger font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Identified Gaps & Missing Nuances:
                  </span>
                  <ul className="space-y-1 text-text-secondary pl-4 list-disc text-[11px]">
                    {socraticResult.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Socratic follow up */}
              <div className="p-4 rounded-xl bg-accent-purple/15 border border-border-accent space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent-purple font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-accent-purple" />
                  Socratic Deepening Challenge:
                </span>
                <p className="text-xs text-text-primary font-medium leading-relaxed">
                  "{socraticResult.nextQuestion}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TOOL 4: CONCEPT BRIDGE & SYNTHESIZER */}
      {/* ============================================================ */}
      {activeTool === 'synthesizer' && (
        <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Scale className="w-4 h-4 text-accent-purple" />
                Concept Bridge & Architectural Synthesizer
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Analyze why one architecture was created to improve upon another, comparing mathematical and hardware trade-offs.
              </p>
            </div>

            <button
              onClick={handleRunSynthesis}
              disabled={synthesisLoading}
              className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all shrink-0 cursor-pointer"
            >
              {synthesisLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Synthesizing...
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  Compare & Synthesize &rarr;
                </>
              )}
            </button>
          </div>

          {/* Selectors for Concept A & B */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-bg-elevated border border-border-subtle">
            <div>
              <label className="text-xs font-mono text-text-muted block mb-1">Concept A (Baseline):</label>
              <select
                value={conceptA}
                onChange={(e) => setConceptA(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-accent-purple cursor-pointer"
              >
                {commonConcepts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-text-muted block mb-1">Concept B (Evolution / Related):</label>
              <select
                value={conceptB}
                onChange={(e) => setConceptB(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-accent-purple cursor-pointer"
              >
                {commonConcepts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {synthesisResult && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent-purple font-semibold">
                  Architectural Evolution:
                </span>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                  {synthesisResult.evolutionNarrative}
                </p>
              </div>

              {/* Key Differences Table */}
              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-xs text-left">
                  <thead className="bg-bg-elevated text-text-muted font-mono text-[11px] border-b border-border-subtle">
                    <tr>
                      <th className="p-3">Architectural Dimension</th>
                      <th className="p-3 text-accent-purple">{synthesisResult.conceptA}</th>
                      <th className="p-3 text-accent-purple">{synthesisResult.conceptB}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {synthesisResult.keyDifferences.map((row, i) => (
                      <tr key={i} className="hover:bg-bg-elevated/40">
                        <td className="p-3 font-semibold text-text-primary">{row.aspect}</td>
                        <td className="p-3 text-text-secondary">{row.conceptA}</td>
                        <td className="p-3 text-text-primary">{row.conceptB}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-accent text-xs text-text-secondary">
                <strong className="text-accent-purple">Synthesis Verdict: </strong>
                {synthesisResult.synthesisSummary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TOOL 5: FORMULA DECODER */}
      {/* ============================================================ */}
      {activeTool === 'formula' && (
        <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Calculator className="w-4 h-4 text-accent-purple" />
                Mathematical Formula Decoder
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Deconstruct continuous and discrete AI formulations term-by-term with tensor shapes and intuition.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedFormula}
                onChange={(e) => {
                  setSelectedFormula(e.target.value);
                  handleRunFormulaDecoder(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-accent-purple cursor-pointer"
              >
                {formulaOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formulaLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted">
              <div className="w-7 h-7 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono mt-3">Decoding mathematical terms...</p>
            </div>
          ) : formulaResult ? (
            <div className="space-y-5 animate-fade-in">
              <div className="p-5 rounded-xl bg-bg-elevated border border-border-accent text-center space-y-2">
                <span className="text-[11px] font-mono text-accent-purple uppercase tracking-widest font-semibold">
                  {formulaResult.title}
                </span>
                <div className="font-mono text-sm sm:text-base text-text-primary font-bold p-3 bg-bg-surface rounded-lg inline-block border border-border-subtle">
                  {formulaResult.latex}
                </div>
                <p className="text-xs text-text-secondary max-w-2xl mx-auto">{formulaResult.purpose}</p>
              </div>

              {/* Term breakdown table */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                  Component-by-Component Variable Table:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formulaResult.components.map((c, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-bg-elevated border border-border-subtle space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-accent-purple">{c.symbol}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle text-text-muted">
                          {c.shape}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-text-primary">{c.name}</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{c.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-secondary leading-relaxed">
                <strong className="text-accent-purple">Physical Intuition: </strong>
                {formulaResult.intuition}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================ */}
      {/* TOOL 6: PYTORCH CODE SANDBOX */}
      {/* ============================================================ */}
      {activeTool === 'code' && (
        <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Code2 className="w-4 h-4 text-accent-purple" />
                PyTorch Implementation Sandbox: <span className="text-accent-purple">{effectiveConcept}</span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Executable, readable tensor implementations with dimension tracking on every forward operation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                disabled={!codeResult}
                className="px-3 py-1.5 rounded-xl bg-bg-elevated hover:bg-bg-surface text-text-primary border border-border-subtle text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {codeCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>

              <button
                onClick={handleRunCodeGenerator}
                disabled={codeLoading}
                className="px-3.5 py-1.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Code
              </button>
            </div>
          </div>

          {codeLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-text-muted">
              <div className="w-7 h-7 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono mt-3">Synthesizing PyTorch implementation for {effectiveConcept}...</p>
            </div>
          ) : codeResult ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-between text-xs text-text-muted font-mono">
                <span>Language: Python 3.10+ / PyTorch 2.x</span>
                <span className="text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Forward Pass Output
                </span>
              </div>

              {/* Code block */}
              <div className="relative rounded-xl overflow-hidden border border-border-subtle bg-bg-elevated">
                <pre className="p-4 text-xs font-mono text-text-primary overflow-x-auto leading-relaxed">
                  <code>{codeResult.code}</code>
                </pre>
              </div>

              {codeResult.explanation && (
                <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-secondary leading-relaxed">
                  <strong className="text-accent-purple">Tensor Dynamics: </strong>
                  {codeResult.explanation}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
