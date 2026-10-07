export type RelationType = 'prerequisite_of' | 'related_to' | 'part_of' | 'depends_on';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  created_at: string;
  theme_preference?: 'light' | 'dark';
}

export interface FactorBreakdown {
  quiz: number;
  revision_freq: number;
  recency: number;
  practical_usage: number;
  learning_activity: number;
  weights: {
    quiz: number;
    revision_freq: number;
    recency: number;
    practical_usage: number;
    learning_activity: number;
  };
}

export interface ForgettingBreakdown {
  base_stability: number;
  n_revisions: number;
  confidence: number;
  usage: number;
  difficulty: number;
  stability_days: number;
  days_since_revision: number;
  retention_rate: number;
}

export interface BottleneckBreakdown {
  unmastered_gap: number; // 1 - confidence
  downstream_dependency_count: number;
  mean_dependency_importance: number;
  downstream_concepts: string[];
}

export interface OpportunityContribution {
  factor: string;
  label: string;
  value: number;
  weight: number;
  weighted_score: number;
  explanation: string;
}

export interface OpportunityBreakdown {
  knowledge_gap: number;
  forgetting_risk: number;
  prerequisite_importance: number;
  downstream_impact: number;
  goal_relevance: number;
  score: number;
  contributions: OpportunityContribution[];
  why_list: string[];
}

export interface Concept {
  id: string;
  name: string;
  user_id: string;
  domain: string;
  description: string;
  difficulty: number; // 1-5
  confidence: number; // 0.0 - 1.0
  forgetting_risk: number; // 0.0 - 1.0
  stability: number; // in days
  safe_revision_days?: number; // days until risk crosses threshold (50%)
  predicted_forget_date?: string; // ISO date string when forgetting risk reaches 50%
  last_revision: string; // ISO date string
  learning_count: number;
  n_revisions: number;
  usage_count: number;
  quiz_accuracy: number;
  degree?: number;
  is_bottleneck?: boolean;
  bottleneck_score?: number;
  opportunity_score?: number;
}

export interface ConceptRelation {
  id: string;
  source: string; // concept name or id
  target: string; // concept name or id
  type: RelationType;
  strength?: number;
}

export interface ConceptDetailState {
  concept: Concept;
  confidence_breakdown: FactorBreakdown;
  forgetting_breakdown: ForgettingBreakdown;
  bottleneck_breakdown: BottleneckBreakdown;
  opportunity_breakdown: OpportunityBreakdown;
  prerequisites: Array<{ name: string; confidence: number; difficulty: number; type: RelationType }>;
  dependents: Array<{ name: string; confidence: number; difficulty: number; type: RelationType }>;
  related: Array<{ name: string; confidence: number; type: RelationType }>;
  learning_history: Array<{
    type: 'quiz' | 'revision' | 'document_ingested';
    date: string;
    details: string;
  }>;
}

export interface GraphNode {
  id: string;
  name: string;
  domain: string;
  confidence: number;
  forgetting_risk: number;
  difficulty: number;
  degree: number;
  is_bottleneck: boolean;
  bottleneck_score: number;
  opportunity_score: number;
  val: number; // for react-force-graph size
  color?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: RelationType;
  color?: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  summary: {
    total_nodes: number;
    total_links: number;
    average_confidence: number;
    high_risk_count: number;
    bottleneck_count: number;
  };
}

export interface GapPathNode {
  name: string;
  confidence: number;
  difficulty: number;
  forgetting_risk: number;
  is_weak: boolean;
  depth: number;
  relation_to_next?: RelationType;
}

export interface KnowledgeGap {
  target: string;
  total_prerequisites: number;
  weak_prerequisites_count: number;
  gap_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  critical_path: GapPathNode[];
  recommended_bridge: {
    start_concept: string;
    target_concept: string;
    action_type: 'REVIEW' | 'QUIZ' | 'STUDY';
    priority: number;
    estimated_minutes: number;
    reason: string;
  };
}

export interface BottleneckItem {
  concept_name: string;
  domain: string;
  confidence: number;
  forgetting_risk: number;
  bottleneck_score: number;
  downstream_count: number;
  blocked_concepts: string[];
  recommendation: string;
  breakdown: BottleneckBreakdown;
}

export interface RecommendationItem {
  concept_name: string;
  domain: string;
  confidence: number;
  forgetting_risk: number;
  opportunity_score: number;
  priority_tier: 'URGENT' | 'HIGH' | 'MEDIUM' | 'EXPLORATORY';
  suggested_action: 'QUICK_QUIZ' | 'SPACED_REVISION' | 'FOUNDATION_STUDY' | 'PRACTICAL_PROJECT';
  estimated_minutes: number;
  why_list: string[];
  breakdown: OpportunityBreakdown;
}

export interface QuizQuestion {
  id: string;
  concept_name: string;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  difficulty: number;
}

export interface QuizSubmission {
  concept_name: string;
  answers: {
    question_id: string;
    selected_option_index: number;
  }[];
  duration_seconds: number;
}

export interface ConceptQuizResult {
  concept: string;
  accuracy: number;
  score: number;
  total: number;
  confidence_before: number;
  confidence_after: number;
  forgetting_risk: number;
  stability_days: number;
  safe_days: number;
  safe_revision_days?: number;
  predicted_forget_date: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  forgetting_prediction_text: string;
}

export interface MultiConceptQuizResponse {
  results: ConceptQuizResult[];
  recommendations_changed: boolean;
  bottlenecks?: BottleneckItem[];
  recommendations?: RecommendationItem[];
  questions_feedback: Array<{
    question: string;
    concept: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }>;
}

export interface DocumentQuizSet {
  doc_id: string;
  doc_title: string;
  concepts: string[];
  total_questions: number;
  questions_by_concept: Record<string, QuizQuestion[]>;
  questions: QuizQuestion[];
}

export interface DocumentUploadResponse {
  success: boolean;
  document: {
    id: string;
    user_id: string;
    title: string;
    filename: string;
    file_size_bytes: number;
    created_at: string;
    concepts_extracted: string[];
    chunks_count: number;
    status: string;
  };
  concepts_created: string[];
  new_concepts_count?: number;
  chunks_created: number;
  message: string;
}

export interface DocumentProcessResponse {
  success: boolean;
  title: string;
  doc_id: string;
  concepts_extracted: string[];
  quiz_ready: boolean;
  document: {
    id: string;
    user_id: string;
    title: string;
    filename: string;
    file_size_bytes: number;
    created_at: string;
    concepts_extracted: string[];
    chunks_count: number;
    status: string;
  };
  new_concepts?: Concept[];
  concepts_created: string[];
  chunks_created: number;
  questions_count?: number;
  message: string;
}

export interface PlannerSlot {
  id: string;
  time_start: string;
  time_end: string;
  duration_minutes: number;
  type: 'LEARN' | 'REVISE' | 'QUIZ' | 'BREAK';
  concept_name?: string;
  badge: 'HIGH RISK' | 'REVISION DUE' | 'WEAK CONCEPT' | 'BOTTLENECK' | 'COGNITIVE REST';
  description: string;
  completed: boolean;
  why: string;
}

export interface TodayPlan {
  date: string;
  total_slots: number;
  total_study_minutes: number;
  target_concepts: string[];
  slots: PlannerSlot[];
}

export interface MentorCitation {
  chunk_id: string;
  doc_title: string;
  text_snippet: string;
  similarity_score: number;
}

export interface MentorConceptStateEvidence {
  name: string;
  confidence: number;
  forgetting_risk: number;
  is_bottleneck: boolean;
  status: 'WEAK' | 'DEVELOPING' | 'MASTERED';
}

export interface MentorMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  evidence?: {
    grounded: boolean;
    grounding_score: number; // 0.0 - 1.0
    concepts_used: MentorConceptStateEvidence[];
    sources_cited: MentorCitation[];
    hallucination_check_passed: boolean;
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'quiz_completed' | 'revision_completed' | 'document_ingested' | 'bottleneck_cleared' | 'gap_bridged';
  title: string;
  description: string;
  concept_name?: string;
  metrics_delta?: {
    confidence_delta?: number;
    risk_delta?: number;
  };
}

export interface DashboardData {
  metrics: {
    knowledge_strength: number; // average confidence (0-100%)
    memory_risk_index: number; // average high-risk concepts ratio
    active_bottlenecks_count: number;
    knowledge_gaps_count: number;
    learning_streak_days: number;
    quizzes_taken_total: number;
    retention_estimate: number; // e.g. 78%
  };
  strength_trend: Array<{
    date: string;
    strength: number;
    retention: number;
    revisions: number;
  }>;
  at_risk_concepts: Array<{
    name: string;
    domain: string;
    confidence: number;
    forgetting_risk: number;
    days_since_revision: number;
    stability_days: number;
  }>;
  top_bottlenecks: BottleneckItem[];
  recommended_actions: RecommendationItem[];
  recent_timeline: TimelineEvent[];
}

export interface EvaluationData {
  concept_extraction: {
    precision: number;
    recall: number;
    f1: number;
    test_documents: number;
    annotated_concepts: number;
    extracted_concepts: number;
    true_positives: number;
    false_positives: number;
    false_negatives: number;
  };
  relationship_accuracy: {
    overall_accuracy: number;
    evaluated_edges: number;
    breakdown_by_type: {
      prerequisite_of: { total: number; correct: number; accuracy: number };
      part_of: { total: number; correct: number; accuracy: number };
      depends_on: { total: number; correct: number; accuracy: number };
      related_to: { total: number; correct: number; accuracy: number };
    };
  };
  forgetting_calibration: {
    mae: number;
    rmse: number;
    auc: number;
    stability_base_fitted: number;
    data_points: number;
    binned_calibration: Array<{
      predicted_risk_bin: string;
      predicted_avg: number;
      actual_failure_rate: number;
      sample_size: number;
    }>;
  };
  recommendation_benchmark: {
    methods: Array<{
      name: string;
      precision_at_k: number;
      acceptance_rate: number;
      learning_efficiency_gain: number;
    }>;
  };
  mentor_groundedness: {
    relevance_score: number;
    citation_fidelity: number;
    hallucination_rate: number;
    total_evaluated_queries: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  storage: {
    mode: 'local';
    workspace: 'in-memory';
    users_file: string;
    concepts_count: number;
  };
}

// ==========================================
// AI TOOLS SUITE TYPES
// ==========================================
export type ExplainerMode = 'analogy' | 'first-principles' | 'eli5' | 'engineering';

export interface ConceptExplainerResult {
  concept: string;
  mode: ExplainerMode;
  explanation: string;
  keyTakeaways: string[];
  formulas?: string[];
  analogies?: string[];
  citations: string[];
  difficultyLevel?: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: number;
  tags: string[];
  repetitionCount?: number;
}

export interface FlashcardDeck {
  concept: string;
  cards: FlashcardItem[];
  totalCards: number;
  generatedAt: string;
}

export interface SocraticFeedback {
  concept: string;
  score: number; // 0 - 100
  accuracy: number; // 0 - 100
  feedback: string;
  strengths: string[];
  gaps: string[];
  nextQuestion: string;
  rubric: {
    clarity: number;
    rigor: number;
    completeness: number;
  };
}

export interface ConceptSynthesis {
  conceptA: string;
  conceptB: string;
  relationshipType: string;
  evolutionNarrative: string;
  keyDifferences: Array<{
    aspect: string;
    conceptA: string;
    conceptB: string;
  }>;
  sharedPrerequisites: string[];
  practicalTradeoffs: string;
  synthesisSummary: string;
}

export interface FormulaComponent {
  symbol: string;
  name: string;
  shape: string;
  role: string;
}

export interface FormulaDecoderResult {
  title: string;
  latex: string;
  purpose: string;
  components: FormulaComponent[];
  intuition: string;
  caveats?: string[];
}

export interface CodeGenerationResult {
  concept: string;
  framework: string;
  language: string;
  code: string;
  explanation: string;
  tensorDimensions: string[];
  forwardPassExample: string;
}

