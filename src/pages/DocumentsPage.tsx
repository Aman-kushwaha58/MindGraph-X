import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Database,
  ArrowRight,
  FileCheck,
  HelpCircle,
  Edit3,
  Check,
  X,
  File,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocs';
import { DocumentProcessResponse } from '../types';

interface Props {
  onRefreshGraph: () => void;
  onNavigateToGraph: () => void;
  onStartDocumentQuiz: (docId: string, docTitle: string, concepts: string[]) => void;
}

export const DocumentsPage: React.FC<Props> = ({
  onRefreshGraph,
  onNavigateToGraph,
  onStartDocumentQuiz,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number | null>(null);
  const [processResult, setProcessResult] = useState<DocumentProcessResponse | null>(null);
  const [editableTitle, setEditableTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const samplePapers = [
    {
      title: 'Diffusion Models & Score-Based Generative SDEs (Song & Sohl-Dickstein)',
      text: `Diffusion models generate data by reversing a progressive noise corruption forward process modeled as a stochastic differential equation (SDE). Score-based matching estimates the score function nabla_x log p(x) using denoising score matching with U-Net convolutional backbones. In forward diffusion, Gaussian noise is incrementally added over continuous time steps. The reverse process solves the reverse-time SDE using predictor-corrector samplers or probability flow ordinary differential equations (ODEs). Latent diffusion architectures apply vector quantization to operate in compressed perceptual latent spaces.`,
    },
    {
      title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness (Dao et al.)',
      text: `Standard transformer attention scales quadratically with sequence length and is memory-bandwidth bound on modern GPUs. FlashAttention restructures the attention computation using classical tiling algorithms to reduce high-bandwidth memory (HBM) reads and writes. By computing softmax normalization incrementally through online softmax scaling without materializing the full N x N intermediate attention matrix, FlashAttention achieves significant memory reductions and speeds up transformer training and inference.`,
    },
  ];

  const hasPastedText = pastedText.trim().length >= 50;
  const hasFile = selectedFile !== null;
  const canRun = (hasPastedText || hasFile) && !processing;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRunPipeline = async () => {
    if (!canRun) return;
    try {
      setProcessing(true);
      setProcessResult(null);

      // 1. Extracting text
      setPipelineStep(1);
      await new Promise((r) => setTimeout(r, 400));

      // 2. Identifying concepts
      setPipelineStep(2);
      await new Promise((r) => setTimeout(r, 500));

      // 3. Building graph
      setPipelineStep(3);
      await new Promise((r) => setTimeout(r, 450));

      // 4. Generating quiz
      setPipelineStep(4);

      let res: DocumentProcessResponse;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (pastedText.trim().length > 10) {
          formData.append('text', pastedText.trim());
        }
        res = await api.processDocument(formData);
      } else {
        res = await api.processDocument({ text: pastedText.trim() });
      }

      setPipelineStep(5); // Complete
      setProcessResult(res);
      setEditableTitle(res.title);
      onRefreshGraph();
    } catch (err: any) {
      console.error(err);
      alert(`Pipeline failed: ${err.message || err}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!processResult || !editableTitle.trim()) return;
    try {
      setSavingTitle(true);
      await api.updateDocumentTitle(processResult.doc_id, editableTitle.trim());
      setProcessResult((prev) => (prev ? { ...prev, title: editableTitle.trim() } : null));
      setIsEditingTitle(false);
      onRefreshGraph();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTitle(false);
    }
  };

  const handleSelectSample = (paper: { title: string; text: string }) => {
    setPastedText(paper.text);
    handleClearFile();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-semibold border border-border-accent">
              Frictionless Pipeline
            </span>
            <span className="text-xs text-text-muted">
              Single-Click Extraction &bull; Auto-Title &bull; Instant Diagnostic Quiz
            </span>
          </div>
          <h2 className="text-lg font-bold text-text-primary mt-1">
            Research Ingestion & Learning Intelligence Pipeline
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Drop study files or paste notes with zero setup. Concepts, graph dependencies, and diagnostic quizzes are automatically generated.
          </p>
        </div>
      </div>

      {/* Progress / Status Stepper while pipeline runs */}
      {pipelineStep !== null && processing && (
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-accent space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-accent-purple flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-purple animate-spin" />
              Running Ingestion & Quiz Generation Pipeline
            </span>
            <span className="text-[11px] font-mono text-text-muted">Step {pipelineStep} of 4</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Extracting Text' },
              { num: 2, label: 'Identifying Concepts' },
              { num: 3, label: 'Building Graph' },
              { num: 4, label: 'Generating Quiz' },
            ].map((step) => {
              const isPast = pipelineStep > step.num;
              const isCurrent = pipelineStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isPast
                      ? 'bg-success-bg border-success/40 text-success'
                      : isCurrent
                      ? 'bg-accent-purple/20 border-accent-purple text-accent-purple animate-pulse font-semibold'
                      : 'bg-bg-elevated border-border-subtle text-text-muted'
                  }`}
                >
                  <span className="text-[10px] font-mono block">Step {step.num}</span>
                  <span className="text-[11px] font-semibold">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* POST-PIPELINE RESULTS SUMMARY CARD */}
      {processResult && !processing && (
        <div className="p-6 rounded-3xl bg-bg-surface border border-border-accent shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-success flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Pipeline Complete &bull; Quiz Ready!
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              {processResult.chunks_created} vector chunks &bull; {processResult.questions_count || 3} MCQs ready
            </span>
          </div>

          {/* Auto-generated Editable Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
              Auto-Generated Document Title (Click to Edit)
            </label>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-bg-elevated border border-border-accent text-sm font-bold text-text-primary focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={savingTitle || !editableTitle.trim()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditableTitle(processResult.title);
                    setIsEditingTitle(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-bg-elevated hover:bg-bg-surface border border-border-subtle text-text-secondary text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h3 className="text-lg font-bold text-text-primary">{processResult.title}</h3>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-accent-purple transition-colors cursor-pointer"
                  title="Rename Document"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Extracted Concepts Chips */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-mono text-text-secondary block">
              Extracted Concepts (Graph nodes initialized at 30% confidence):
            </span>
            <div className="flex flex-wrap gap-2">
              {processResult.concepts_extracted.map((cName) => (
                <span
                  key={cName}
                  className="px-3 py-1 rounded-xl bg-accent-purple/15 border border-border-accent text-xs font-mono text-accent-purple flex items-center gap-1.5 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {cName}
                </span>
              ))}
            </div>
          </div>

          {/* Core Action: Take Quiz Now CTA */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() =>
                onStartDocumentQuiz(
                  processResult.doc_id,
                  processResult.title,
                  processResult.concepts_extracted
                )
              }
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Take Quiz Now ({processResult.concepts_extracted.length} Concepts Ready) &rarr;
            </button>
            <button
              onClick={onNavigateToGraph}
              className="py-3 px-4 rounded-2xl bg-bg-elevated hover:bg-bg-surface border border-border-subtle text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Inspect in Graph &rarr;
            </button>
          </div>
        </div>
      )}

      {/* SINGLE UNIFIED INPUT AREA (Paste & Upload in One Card) */}
      <div className="p-6 rounded-3xl bg-bg-surface border border-border-subtle shadow-xl space-y-5">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent-purple" />
            Study Material Input (Paste or Drop File)
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Paste lecture excerpts or drop a slide deck/paper. No title typing required — title is auto-derived from content.
          </p>
        </div>

        {/* Text Area for Pasting */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
            <span>Pasted Text</span>
            <span>
              {pastedText.trim().length} chars {pastedText.trim().length > 0 && pastedText.trim().length < 50 ? '(min 50 required)' : ''}
            </span>
          </div>
          <textarea
            rows={5}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste lecture notes, PPT text, paper excerpt, or any study material here..."
            className="w-full p-4 rounded-2xl bg-bg-elevated border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple leading-relaxed font-sans"
          />
        </div>

        {/* Divider / OR */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border-subtle"></div>
          <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-text-muted">
            OR UPLOAD FILE (.PDF, .PPTX, .DOCX, .MD, .TXT)
          </span>
          <div className="flex-grow border-t border-border-subtle"></div>
        </div>

        {/* Drag-and-drop / File Picker Zone */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.pptx,.docx,.md,.txt,.csv"
          className="hidden"
        />

        {selectedFile ? (
          <div className="p-4 rounded-2xl bg-accent-purple/15 border border-border-accent flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-accent-purple/20 border border-border-accent flex items-center justify-center shrink-0">
                <File className="w-4 h-4 text-accent-purple" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-text-primary truncate">{selectedFile.name}</p>
                <p className="text-[10px] font-mono text-text-muted">
                  {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready for text extraction
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-danger transition-colors cursor-pointer"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-accent-purple bg-accent-purple/15'
                : 'border-border-subtle hover:border-border-accent bg-bg-elevated/60 hover:bg-bg-elevated'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center text-accent-purple">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">
                Drag and drop study document here, or <span className="text-accent-purple underline">browse files</span>
              </p>
              <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                Supports PDF, PowerPoint (.pptx), Word (.docx), Markdown (.md), Plain Text (.txt)
              </p>
            </div>
          </div>
        )}

        {/* Single Action Button: Run Extraction Pipeline */}
        <div className="pt-2">
          <button
            onClick={handleRunPipeline}
            disabled={!canRun}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            {processing ? 'Running Extraction & Generating Quiz...' : 'Run Extraction Pipeline'}
          </button>
          {!canRun && !processing && (
            <p className="text-[10px] text-text-muted text-center mt-1.5 font-mono">
              Provide at least 50 characters of study text or upload a document to enable extraction
            </p>
          )}
        </div>
      </div>

      {/* Preset Sample Papers (One-Click Testing) */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-purple" />
            Quick Test Samples (One-Click)
          </h3>
          <span className="text-[10px] font-mono text-text-muted">Pre-Configured Papers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {samplePapers.map((paper, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-border-accent transition-colors space-y-2 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-text-primary leading-snug">{paper.title}</h4>
                <p className="text-[11px] text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                  {paper.text}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => handleSelectSample(paper)}
                  className="px-2.5 py-1 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-text-secondary text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Paste Text
                </button>
                <button
                  onClick={() => {
                    setPastedText(paper.text);
                    handleClearFile();
                    // Trigger directly
                    setTimeout(() => {
                      api.processDocument({ text: paper.text }).then((res) => {
                        setProcessResult(res);
                        setEditableTitle(res.title);
                        onRefreshGraph();
                      }).catch(console.error);
                    }, 50);
                  }}
                  disabled={processing}
                  className="px-3 py-1 rounded-lg bg-accent-purple/20 hover:bg-accent-purple text-accent-purple hover:text-white text-[11px] font-semibold border border-border-accent transition-colors cursor-pointer"
                >
                  Load & Run &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Currently Indexed Documents List */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Database className="w-4 h-4 text-accent-purple" />
          Indexed Documents in Corpus
        </h3>

        <div className="divide-y divide-border-subtle">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <div key={doc.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-text-primary">{doc.title}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-text-muted">{doc.filename}</span>
                  <span className="text-[10px] font-mono text-accent-purple">
                    {doc.chunks_count} chunks indexed in Qdrant
                  </span>
                  <span className="text-[10px] text-success font-semibold font-mono">STATUS: INDEXED</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {doc.concepts_extracted.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded bg-bg-elevated border border-border-subtle text-[10px] font-mono text-text-secondary"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onStartDocumentQuiz(doc.id, doc.title, doc.concepts_extracted)}
                  className="px-3 py-1 rounded-lg bg-accent-purple/20 hover:bg-accent-purple text-accent-purple hover:text-white border border-border-accent text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Quiz &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
