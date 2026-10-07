/**
 * Seed data for MindGraph X
 * Phase 6 Requirement:
 * Attention is a real, computed bottleneck (about 27% confidence).
 * All metrics pass through the pure intelligence engine functions.
 */

import {
  computeConfidence,
  computeForgettingRisk,
  computeBottleneck,
  computeOpportunityScore,
  ConfidenceSignals,
} from '../services/intelligence';
import { Concept, ConceptRelation, TimelineEvent, QuizQuestion } from '../types';

export interface RawConceptSeed {
  id: string;
  name: string;
  domain: string;
  description: string;
  difficulty: number; // 1-5
  signals: ConfidenceSignals;
}

export const INITIAL_CONCEPTS_RAW: RawConceptSeed[] = [
  {
    id: 'c-python',
    name: 'Python',
    domain: 'Software Engineering',
    description: 'General-purpose programming language widely used in AI, scientific computing, and data pipelines.',
    difficulty: 2,
    signals: {
      quiz_accuracy: 0.92,
      n_revisions: 6,
      days_since_revision: 2,
      usage_count: 14,
      learning_count: 10,
    },
  },
  {
    id: 'c-linear-algebra',
    name: 'Linear Algebra',
    domain: 'Mathematics',
    description: 'Vectors, matrices, dot products, eigenvalues, and coordinate transformations underlying tensor operations.',
    difficulty: 3,
    signals: {
      quiz_accuracy: 0.85,
      n_revisions: 4,
      days_since_revision: 5,
      usage_count: 9,
      learning_count: 7,
    },
  },
  {
    id: 'c-ml',
    name: 'Machine Learning',
    domain: 'Core AI',
    description: 'Foundational paradigm where computational models learn inductive statistical patterns from training distributions.',
    difficulty: 3,
    signals: {
      quiz_accuracy: 0.88,
      n_revisions: 5,
      days_since_revision: 4,
      usage_count: 11,
      learning_count: 8,
    },
  },
  {
    id: 'c-nn',
    name: 'Neural Networks',
    domain: 'Deep Learning',
    description: 'Multi-layer perceptron architectures utilizing non-linear activation functions and affine transformations.',
    difficulty: 4,
    signals: {
      quiz_accuracy: 0.78,
      n_revisions: 4,
      days_since_revision: 7,
      usage_count: 8,
      learning_count: 6,
    },
  },
  {
    id: 'c-backprop',
    name: 'Backpropagation',
    domain: 'Deep Learning',
    description: 'Reverse-mode automatic differentiation applying the multivariable calculus chain rule to calculate weight gradients.',
    difficulty: 4,
    signals: {
      quiz_accuracy: 0.74,
      n_revisions: 3,
      days_since_revision: 9,
      usage_count: 6,
      learning_count: 5,
    },
  },
  {
    id: 'c-cnn',
    name: 'CNN',
    domain: 'Computer Vision',
    description: 'Convolutional neural networks featuring discrete spatial convolutions, pooling, and translation equivariance.',
    difficulty: 3,
    signals: {
      quiz_accuracy: 0.80,
      n_revisions: 3,
      days_since_revision: 8,
      usage_count: 5,
      learning_count: 5,
    },
  },
  {
    id: 'c-seq-model',
    name: 'Sequence Modeling',
    domain: 'Deep Learning',
    description: 'Sequential inductive architectures (RNNs, LSTMs, GRUs) operating across temporal token sequences.',
    difficulty: 3,
    signals: {
      quiz_accuracy: 0.65,
      n_revisions: 2,
      days_since_revision: 12,
      usage_count: 4,
      learning_count: 4,
    },
  },
  {
    id: 'c-attention',
    name: 'Attention',
    domain: 'Transformer Architecture',
    description: 'Dynamic softmax weighting mechanism mapping query, key, and value vectors: Softmax(QK^T / sqrt(d_k))V.',
    difficulty: 4,
    // Carefully set signals so Confidence evaluates to ~0.27 (0.268) as specified by Phase 6
    signals: {
      quiz_accuracy: 0.25,
      n_revisions: 1,
      days_since_revision: 16,
      usage_count: 2,
      learning_count: 2,
    },
  },
  {
    id: 'c-pos-encoding',
    name: 'Positional Encoding',
    domain: 'Transformer Architecture',
    description: 'Deterministic sinusoidal waves or learned spatial embeddings injected to supply token sequence order.',
    difficulty: 3,
    signals: {
      quiz_accuracy: 0.52,
      n_revisions: 2,
      days_since_revision: 14,
      usage_count: 3,
      learning_count: 3,
    },
  },
  {
    id: 'c-transformer',
    name: 'Transformer',
    domain: 'Transformer Architecture',
    description: 'All-attention encoder-decoder or decoder-only stack with residual normalization and multi-head attention.',
    difficulty: 4,
    signals: {
      quiz_accuracy: 0.44,
      n_revisions: 2,
      days_since_revision: 11,
      usage_count: 4,
      learning_count: 4,
    },
  },
  {
    id: 'c-embeddings',
    name: 'Embeddings',
    domain: 'NLP & Information Retrieval',
    description: 'Dense vector representations mapping linguistic or conceptual tokens into continuous semantic metric spaces.',
    difficulty: 3,
    signals: {
      quiz_accuracy: 0.72,
      n_revisions: 3,
      days_since_revision: 6,
      usage_count: 7,
      learning_count: 6,
    },
  },
  {
    id: 'c-vector-search',
    name: 'Vector Search',
    domain: 'Information Retrieval',
    description: 'Approximate Nearest Neighbor (ANN) index traversal using HNSW graphs or IVF flat quantization.',
    difficulty: 3,
    signals: {
      quiz_accuracy: 0.68,
      n_revisions: 3,
      days_since_revision: 10,
      usage_count: 6,
      learning_count: 5,
    },
  },
  {
    id: 'c-sql',
    name: 'SQL',
    domain: 'Databases',
    description: 'Structured Query Language for relational joins, aggregations, windowing functions, and ACID storage.',
    difficulty: 2,
    signals: {
      quiz_accuracy: 0.86,
      n_revisions: 5,
      days_since_revision: 4,
      usage_count: 12,
      learning_count: 7,
    },
  },
  {
    id: 'c-llm',
    name: 'LLM',
    domain: 'Generative AI',
    description: 'Large language models trained via self-supervised next-token autoregression, instruction tuning, and RLHF.',
    difficulty: 4,
    signals: {
      quiz_accuracy: 0.58,
      n_revisions: 2,
      days_since_revision: 9,
      usage_count: 5,
      learning_count: 5,
    },
  },
  {
    id: 'c-rag',
    name: 'RAG',
    domain: 'Applied Generative AI',
    description: 'Retrieval-Augmented Generation synthesizing factual semantic chunks to ground LLM inference without hallucination.',
    difficulty: 4,
    signals: {
      quiz_accuracy: 0.48,
      n_revisions: 2,
      days_since_revision: 13,
      usage_count: 4,
      learning_count: 4,
    },
  },
];

export const INITIAL_RELATIONS: ConceptRelation[] = [
  { id: 'r1', source: 'Linear Algebra', target: 'Neural Networks', type: 'prerequisite_of' },
  { id: 'r2', source: 'Python', target: 'Machine Learning', type: 'prerequisite_of' },
  { id: 'r3', source: 'Machine Learning', target: 'Neural Networks', type: 'prerequisite_of' },
  { id: 'r4', source: 'Neural Networks', target: 'Sequence Modeling', type: 'prerequisite_of' },
  { id: 'r5', source: 'Neural Networks', target: 'CNN', type: 'prerequisite_of' },
  { id: 'r6', source: 'Backpropagation', target: 'Neural Networks', type: 'part_of' },
  { id: 'r7', source: 'Sequence Modeling', target: 'Attention', type: 'prerequisite_of' },
  { id: 'r8', source: 'Attention', target: 'Transformer', type: 'prerequisite_of' }, // Key bottleneck edge
  { id: 'r9', source: 'Positional Encoding', target: 'Transformer', type: 'part_of' },
  { id: 'r10', source: 'Transformer', target: 'LLM', type: 'prerequisite_of' },
  { id: 'r11', source: 'Transformer', target: 'Embeddings', type: 'prerequisite_of' },
  { id: 'r12', source: 'Embeddings', target: 'Vector Search', type: 'prerequisite_of' },
  { id: 'r13', source: 'Vector Search', target: 'RAG', type: 'prerequisite_of' },
  { id: 'r14', source: 'LLM', target: 'RAG', type: 'prerequisite_of' },
  { id: 'r15', source: 'SQL', target: 'RAG', type: 'related_to' },
];

export function buildComputedInitialGraph(): {
  concepts: Concept[];
  conceptMap: Map<string, Concept>;
  relations: ConceptRelation[];
  prerequisitesOf: Map<string, Array<{ name: string; type: string }>>;
  dependentsOf: Map<string, string[]>;
} {
  const conceptMap = new Map<string, Concept>();
  const prerequisitesOf = new Map<string, Array<{ name: string; type: string }>>();
  const dependentsOf = new Map<string, string[]>();

  // Initialize adjacency maps
  for (const rel of INITIAL_RELATIONS) {
    // For prerequisite_of: source is prerequisite of target
    if (rel.type === 'prerequisite_of' || rel.type === 'part_of' || rel.type === 'depends_on') {
      const existingPrereqs = prerequisitesOf.get(rel.target) || [];
      existingPrereqs.push({ name: rel.source, type: rel.type });
      prerequisitesOf.set(rel.target, existingPrereqs);

      const existingDeps = dependentsOf.get(rel.source) || [];
      existingDeps.push(rel.target);
      dependentsOf.set(rel.source, existingDeps);
    }
  }

  // First pass: compute confidence and forgetting risk
  for (const item of INITIAL_CONCEPTS_RAW) {
    const confResult = computeConfidence(item.signals);
    const forgettingResult = computeForgettingRisk({
      days_since_revision: item.signals.days_since_revision,
      n_revisions: item.signals.n_revisions,
      confidence: confResult.score,
      usage_count: item.signals.usage_count,
      difficulty: item.difficulty,
    });

    const lastDate = new Date();
    lastDate.setDate(lastDate.getDate() - item.signals.days_since_revision);

    const concept: Concept = {
      id: item.id,
      name: item.name,
      user_id: 'demo-user-1',
      domain: item.domain,
      description: item.description,
      difficulty: item.difficulty,
      confidence: confResult.score,
      forgetting_risk: forgettingResult.risk,
      stability: forgettingResult.stability,
      last_revision: lastDate.toISOString(),
      learning_count: item.signals.learning_count,
      n_revisions: item.signals.n_revisions,
      usage_count: item.signals.usage_count,
      quiz_accuracy: item.signals.quiz_accuracy,
      degree: 0,
    };
    conceptMap.set(item.name, concept);
  }

  // Second pass: compute degree, bottlenecks and opportunities
  const concepts = Array.from(conceptMap.values());

  for (const c of concepts) {
    // Degree = count of connected edges
    let deg = 0;
    for (const r of INITIAL_RELATIONS) {
      if (r.source === c.name || r.target === c.name) deg++;
    }
    c.degree = deg;

    // Bottleneck computation
    const bResult = computeBottleneck(c.name, conceptMap, dependentsOf);
    c.bottleneck_score = bResult.score;
    // Marked as bottleneck if score > 1.5 or has high downstream deps and confidence < 0.45
    c.is_bottleneck = bResult.score >= 2.0;

    // Opportunity score computation
    const downstreamDeps = dependentsOf.get(c.name) || [];
    const oppResult = computeOpportunityScore(c, {
      knowledge_gap: c.confidence < 0.4 ? 0.8 : c.confidence < 0.6 ? 0.4 : 0.1,
      downstream_impact: Math.min(1.0, downstreamDeps.length / 4.0),
      prerequisite_importance: Math.min(1.0, (c.degree || 1) / 5.0),
      goal_relevance: c.name === 'Attention' || c.name === 'Transformer' || c.name === 'RAG' ? 0.9 : 0.4,
    });
    c.opportunity_score = oppResult.score;
  }

  return {
    concepts,
    conceptMap,
    relations: INITIAL_RELATIONS,
    prerequisitesOf,
    dependentsOf,
  };
}

export const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    type: 'quiz_completed',
    title: 'Completed Quiz: Linear Algebra Foundations',
    description: 'Answered 5/5 questions correctly with 94% accuracy.',
    concept_name: 'Linear Algebra',
    metrics_delta: { confidence_delta: +0.08, risk_delta: -0.22 },
  },
  {
    id: 'evt-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    type: 'document_ingested',
    title: 'Ingested Paper: "Attention Is All You Need"',
    description: 'Extracted 6 concepts, 8 relations, and indexed 14 semantic chunks.',
    concept_name: 'Transformer',
  },
  {
    id: 'evt-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    type: 'quiz_completed',
    title: 'Diagnostic Quiz: Attention Softmax Dynamics',
    description: 'Scored 1/5 (20%). High confusion regarding QK transpose scaling.',
    concept_name: 'Attention',
    metrics_delta: { confidence_delta: -0.05, risk_delta: +0.35 },
  },
  {
    id: 'evt-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    type: 'revision_completed',
    title: 'Revision Session: Vector Search & HNSW Indexing',
    description: 'Completed 20-minute conceptual recall and similarity search coding exercise.',
    concept_name: 'Vector Search',
    metrics_delta: { confidence_delta: +0.06, risk_delta: -0.18 },
  },
];

export const INITIAL_QUIZ_REPOSITORY: Record<string, QuizQuestion[]> = {
  Attention: [
    {
      id: 'q-att-1',
      concept_name: 'Attention',
      question: 'Why do scaled dot-product attention models divide the dot product QK^T by sqrt(d_k)?',
      options: [
        'To speed up GPU memory bandwidth allocation during forward pass',
        'To prevent large dot product magnitudes from pushing the softmax into regions with vanishing gradients',
        'To guarantee that self-attention matrices remain strictly orthogonal',
        'To reduce the computational complexity from quadratic O(N^2) to linear O(N)',
      ],
      correct_option_index: 1,
      explanation: 'For large values of d_k, dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients. Dividing by sqrt(d_k) counteracts this effect.',
      difficulty: 4,
    },
    {
      id: 'q-att-2',
      concept_name: 'Attention',
      question: 'In self-attention, what does the resulting attention weight matrix A = Softmax(QK^T / sqrt(d_k)) represent?',
      options: [
        'The static vocabulary frequency distribution of the training dataset',
        'The dynamic pairwise alignment scores indicating how much focus token i places on token j',
        'The feedforward layer weight matrices after layer normalization',
        'The positional distance between subsequent token embeddings',
      ],
      correct_option_index: 1,
      explanation: 'The attention matrix A represents pairwise compatibility scores normalized across sequence length, determining how information from all values V is aggregated.',
      difficulty: 3,
    },
    {
      id: 'q-att-3',
      concept_name: 'Attention',
      question: 'What is the primary architectural advantage of Multi-Head Attention over single-head attention?',
      options: [
        'It eliminates the need for activation functions throughout the model',
        'It allows the model to jointly attend to information from different representation subspaces at different positions',
        'It reduces the parameter count of the projection matrices to zero',
        'It ensures recurrent inductive bias across infinite sequence lengths',
      ],
      correct_option_index: 1,
      explanation: 'Multi-head attention projects queries, keys, and values into multiple subspaces, allowing the model to capture syntax, semantics, and relative positions simultaneously.',
      difficulty: 4,
    },
    {
      id: 'q-att-4',
      concept_name: 'Attention',
      question: 'How does causal (masked) self-attention in decoder-only language models prevent look-ahead bias?',
      options: [
        'By setting subsequent position values in the attention logits to -infinity prior to softmax',
        'By executing an asynchronous reverse-time RNN loop',
        'By randomly dropping tokens with dropout probability p = 0.5',
        'By removing the value vectors V for future positions',
      ],
      correct_option_index: 0,
      explanation: 'Masking logits with -inf ensures that after the softmax operation exp(-inf) = 0, preventing earlier tokens from attending to any future tokens.',
      difficulty: 4,
    },
    {
      id: 'q-att-5',
      concept_name: 'Attention',
      question: 'Given sequence length N and embedding dimension d, what is the asymptotic computational time complexity of vanilla self-attention?',
      options: [
        'O(N * log N)',
        'O(N * d^2 + N^2 * d)',
        'O(d * log N)',
        'O(1) constant time with cache',
      ],
      correct_option_index: 1,
      explanation: 'Projection matrices take O(N * d^2), and the QK^T matrix multiplication takes O(N^2 * d), yielding quadratic O(N^2 * d) scaling with sequence length.',
      difficulty: 4,
    },
  ],
  Transformer: [
    {
      id: 'q-trans-1',
      concept_name: 'Transformer',
      question: 'What is the primary function of residual connections (Add & Norm) in Transformer encoder and decoder layers?',
      options: [
        'To reduce token vocabulary embedding sizes',
        'To facilitate direct gradient flow across deep networks and mitigate vanishing gradients',
        'To convert decoder-only models into bidirectional encoders',
        'To replace multi-head attention with convolutional kernels',
      ],
      correct_option_index: 1,
      explanation: 'Residual connections provide identity skip paths that let backpropagation gradients flow unimpeded directly back to earlier layers.',
      difficulty: 3,
    },
    {
      id: 'q-trans-2',
      concept_name: 'Transformer',
      question: 'Why do Transformers require Positional Encoding when recurrent neural networks do not?',
      options: [
        'Transformers do not have recurrence or convolutions, so they are permutation-equivariant without positional signals',
        'Recurrent networks have no hidden states',
        'Positional encoding compresses the vocabulary size',
        'Attention cannot compute dot products without sinusoidal functions',
      ],
      correct_option_index: 0,
      explanation: 'Because attention computes all pairwise dot products simultaneously, word order information would be entirely lost without positional encodings.',
      difficulty: 4,
    },
    {
      id: 'q-trans-3',
      concept_name: 'Transformer',
      question: 'In a standard Transformer block, what succeeds the multi-head self-attention sub-layer?',
      options: [
        'A position-wise point-wise feedforward network (FFN) with two linear transformations and an activation function',
        'A bidirectional LSTM recurrent layer',
        'A MaxPool2D pooling operator',
        'A KNN vector search index',
      ],
      correct_option_index: 0,
      explanation: 'The standard Transformer block consists of Multi-Head Self-Attention followed by LayerNorm, and then a Position-wise Feed-Forward Network followed by LayerNorm.',
      difficulty: 3,
    },
    {
      id: 'q-trans-4',
      concept_name: 'Transformer',
      question: 'Which normalization approach places LayerNorm directly on the inputs of the sub-layers (Pre-LN) rather than the residual stream (Post-LN)?',
      options: [
        'Pre-LayerNorm (Pre-LN), which provides superior training stability in deep models without requiring warm-up',
        'Batch Normalization (BatchNorm)',
        'Instance Normalization (IN)',
        'Weight Normalization (WeightNorm)',
      ],
      correct_option_index: 0,
      explanation: 'Pre-LN stabilizes gradients across very deep transformers, avoiding early gradient explosion/collapse observed in original Post-LN architectures.',
      difficulty: 4,
    },
    {
      id: 'q-trans-5',
      concept_name: 'Transformer',
      question: 'What is the dimensionality expansion factor typically applied in the hidden dimension of the Transformer Feed-Forward Network (FFN)?',
      options: ['1x (no expansion)', '4x (e.g. 768 to 3072 or 1024 to 4096)', '16x', '0.5x compression'],
      correct_option_index: 1,
      explanation: 'The standard Transformer paper uses d_ff = 4 * d_model (for instance, d_model = 512, d_ff = 2048).',
      difficulty: 3,
    },
  ],
  RAG: [
    {
      id: 'q-rag-1',
      concept_name: 'RAG',
      question: 'What is the fundamental architectural motivation for Retrieval-Augmented Generation (RAG)?',
      options: [
        'To eliminate the need for an underlying LLM entirely',
        'To ground generation in external factual knowledge bases, mitigating hallucinations and outdated parametric memory',
        'To reduce vector database storage costs to zero',
        'To replace transformer attention with rule-based heuristics',
      ],
      correct_option_index: 1,
      explanation: 'RAG combines non-parametric index retrieval with parametric LLM generation to ensure answers cite verified context and avoid hallucinations.',
      difficulty: 3,
    },
    {
      id: 'q-rag-2',
      concept_name: 'RAG',
      question: 'In a modern RAG pipeline, why is a Cross-Encoder Reranker frequently placed after bi-encoder vector search?',
      options: [
        'Cross-encoders evaluate full query-document token interactions together, yielding higher precision relevance ranking',
        'Cross-encoders run faster than vector index searches',
        'Cross-encoders reduce token context length in the prompt',
        'Cross-encoders generate vector embeddings for Qdrant storage',
      ],
      correct_option_index: 0,
      explanation: 'Bi-encoders allow fast approximate retrieval across millions of docs, while cross-encoders compute exact cross-attention between query and chunk for top candidates.',
      difficulty: 4,
    },
    {
      id: 'q-rag-3',
      concept_name: 'RAG',
      question: 'Which chunking strategy helps maintain coherent semantic boundaries when preparing documents for vector search?',
      options: [
        'Arbitrary 50-character hard truncation',
        'Semantic or recursive chunking with token overlap and paragraph boundaries',
        'Storing entire 500-page PDFs as a single single embedding vector',
        'Removing all whitespace and punctuation',
      ],
      correct_option_index: 1,
      explanation: 'Recursive character chunking respects paragraph and sentence breaks, and token overlap prevents context loss across chunk splits.',
      difficulty: 3,
    },
    {
      id: 'q-rag-4',
      concept_name: 'RAG',
      question: 'What is "Lost in the Middle" phenomenon in RAG prompt engineering?',
      options: [
        'LLMs tend to prioritize information at the very beginning and very end of the context window over the middle',
        'Vector databases lose middle vectors when partitions are full',
        'The embedding model ignores adjectives in the middle of sentences',
        'GPU memory drops attention heads in the middle layers',
      ],
      correct_option_index: 0,
      explanation: 'Research demonstrates LLM recall is highest for information placed at the start or end of the prompt context, with performance dipping for chunks in the center.',
      difficulty: 4,
    },
    {
      id: 'q-rag-5',
      concept_name: 'RAG',
      question: 'How does Hybrid Search improve retrieval robustness over dense vector search alone?',
      options: [
        'It combines sparse keyword matching (BM25) with dense semantic vector embeddings via Reciprocal Rank Fusion (RRF)',
        'It executes parallel SQL joins on unindexed strings',
        'It removes low-confidence concepts from the user graph',
        'It re-trains the LLM weights on every query',
      ],
      correct_option_index: 0,
      explanation: 'Hybrid search leverages sparse retrieval for exact lexical matches (IDs, codes, specific terminology) and dense vectors for thematic semantic matching.',
      difficulty: 4,
    },
  ],
};
