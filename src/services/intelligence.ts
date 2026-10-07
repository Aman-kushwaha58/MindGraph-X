/**
 * MindGraph X: Pure Intelligence Layer
 * Non-negotiable Rule #2: Pure, unit-tested functions without direct DB calls.
 * Non-negotiable Rule #3: Every score returns a per-factor breakdown for "Why?" transparency.
 * Non-negotiable Rule #7: Estimates forgetting probability (not exact prediction),
 *                         brain-inspired visualization of semantic knowledge graph.
 */

import {
  FactorBreakdown,
  ForgettingBreakdown,
  BottleneckBreakdown,
  OpportunityBreakdown,
  OpportunityContribution,
  Concept,
  ConceptRelation,
  KnowledgeGap,
  GapPathNode,
  BottleneckItem,
  RecommendationItem
} from '../types';

export interface ConfidenceSignals {
  quiz_accuracy: number;        // 0.0 - 1.0 (average score on quizzes)
  n_revisions: number;          // count of revisions completed
  days_since_revision: number;  // days elapsed since last active study
  usage_count: number;          // times referenced/used in exercises or mentor Q&A
  learning_count: number;       // total distinct study sessions
}

export interface IntelligenceConfig {
  confidence_weights: {
    quiz: number;
    revision_freq: number;
    recency: number;
    practical_usage: number;
    learning_activity: number;
  };
  stability_base_days: number;
  opportunity_weights: {
    knowledge_gap: number;
    forgetting_risk: number;
    prerequisite_importance: number;
    downstream_impact: number;
    goal_relevance: number;
    unmastered_gap: number;
  };
}

export const DEFAULT_CONFIG: IntelligenceConfig = {
  confidence_weights: {
    quiz: 0.30,
    revision_freq: 0.20,
    recency: 0.15,
    practical_usage: 0.20,
    learning_activity: 0.15,
  },
  stability_base_days: 7.0,
  opportunity_weights: {
    knowledge_gap: 0.25,
    forgetting_risk: 0.25,
    prerequisite_importance: 0.20,
    downstream_impact: 0.15,
    goal_relevance: 0.05,
    unmastered_gap: 0.10,
  },
};

/**
 * 1. Confidence Model: Pure function
 * Confidence = 0.30*quiz + 0.20*revision_freq + 0.15*recency + 0.20*practical_usage + 0.15*learning_activity (each 0-1)
 */
export function computeConfidence(
  signals: ConfidenceSignals,
  config: IntelligenceConfig = DEFAULT_CONFIG
): { score: number; breakdown: FactorBreakdown } {
  const quiz = Math.min(1.0, Math.max(0.0, signals.quiz_accuracy));
  
  // Revision frequency: 5+ revisions reaches full normalized score (1.0)
  const revision_freq = Math.min(1.0, Math.max(0.0, signals.n_revisions / 5.0));
  
  // Recency: exponential decay based on days elapsed
  // If revised today (0 days) = 1.0; 7 days = ~0.6; 14 days = ~0.37; 30+ days = ~0.1
  const recency = Math.min(1.0, Math.max(0.0, Math.exp(-signals.days_since_revision / 14.0)));
  
  // Practical usage: 8+ usages in problem solving/notes reaches 1.0
  const practical_usage = Math.min(1.0, Math.max(0.0, signals.usage_count / 8.0));
  
  // Learning activity: 6+ study sessions reaches 1.0
  const learning_activity = Math.min(1.0, Math.max(0.0, signals.learning_count / 6.0));

  const w = config.confidence_weights;
  const rawScore = 
    w.quiz * quiz +
    w.revision_freq * revision_freq +
    w.recency * recency +
    w.practical_usage * practical_usage +
    w.learning_activity * learning_activity;

  const score = Math.round(Math.min(1.0, Math.max(0.0, rawScore)) * 1000) / 1000;

  return {
    score,
    breakdown: {
      quiz: Math.round(quiz * 100) / 100,
      revision_freq: Math.round(revision_freq * 100) / 100,
      recency: Math.round(recency * 100) / 100,
      practical_usage: Math.round(practical_usage * 100) / 100,
      learning_activity: Math.round(learning_activity * 100) / 100,
      weights: { ...w },
    },
  };
}

/**
 * 2. Forgetting Model: Pure function
 * estimates forgetting probability based on spaced repetition & cognitive stability.
 * stability = base * (1+n_revisions) * (0.5+confidence) * (1+usage) / (0.5 + difficulty/5)
 * retention = exp(-days_since_revision / stability)
 * forgetting_risk = 1 - retention
 */
export function computeForgettingRisk(
  params: {
    days_since_revision: number;
    n_revisions: number;
    confidence: number;
    usage_count: number;
    difficulty: number; // 1 to 5
  },
  config: IntelligenceConfig = DEFAULT_CONFIG
): { risk: number; retention: number; stability: number; breakdown: ForgettingBreakdown } {
  const base = config.stability_base_days;
  const n_rev = Math.max(0, params.n_revisions);
  const conf = Math.min(1.0, Math.max(0.0, params.confidence));
  // normalized usage impact: caps at 2.0 multiplier
  const usageFactor = Math.min(2.0, Math.max(0.0, params.usage_count / 10.0));
  const diff = Math.min(5, Math.max(1, params.difficulty));
  const days = Math.max(0, params.days_since_revision);

  // Stability formula
  const numerator = base * (1.0 + n_rev) * (0.5 + conf) * (1.0 + usageFactor);
  const denominator = 0.5 + (diff / 5.0);
  const stability = Math.max(0.5, numerator / denominator);

  const retention = Math.exp(-days / stability);
  const risk = Math.min(1.0, Math.max(0.0, 1.0 - retention));

  return {
    risk: Math.round(risk * 1000) / 1000,
    retention: Math.round(retention * 1000) / 1000,
    stability: Math.round(stability * 10) / 10,
    breakdown: {
      base_stability: base,
      n_revisions: n_rev,
      confidence: conf,
      usage: usageFactor,
      difficulty: diff,
      stability_days: Math.round(stability * 10) / 10,
      days_since_revision: Math.round(days * 10) / 10,
      retention_rate: Math.round(retention * 1000) / 1000,
    },
  };
}

/**
 * Predicts safe revision window:
 * Solves the forgetting formula for time until forgetting_risk crosses threshold (e.g. 50%).
 * risk = 1 - exp(-t / stability) = threshold
 * exp(-t / stability) = 1 - threshold
 * -t / stability = ln(1 - threshold)
 * t = -stability * ln(1 - threshold)
 */
export function predictSafeRevisionWindow(
  stabilityDays: number,
  threshold = 0.50
): { safe_days: number; predicted_forget_date: string; natural_language_date: string } {
  const safe_days = Math.max(0.5, Math.round(-stabilityDays * Math.log(1.0 - threshold) * 10) / 10);
  const targetDate = new Date(Date.now() + safe_days * 24 * 60 * 60 * 1000);
  
  const natural_language_date = targetDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    safe_days,
    predicted_forget_date: targetDate.toISOString(),
    natural_language_date,
  };
}

/**
 * 3. Bottleneck Score: Pure function
 * Bottleneck score = (1 - confidence) * downstream_dependency_count * mean_dependency_importance
 */
export function computeBottleneck(
  conceptName: string,
  conceptMap: Map<string, Concept>,
  prerequisiteGraph: Map<string, string[]> // prerequisite -> list of dependent concepts
): { score: number; breakdown: BottleneckBreakdown } {
  const concept = conceptMap.get(conceptName);
  if (!concept) {
    return {
      score: 0,
      breakdown: {
        unmastered_gap: 0,
        downstream_dependency_count: 0,
        mean_dependency_importance: 1.0,
        downstream_concepts: [],
      },
    };
  }

  // Find all downstream concepts recursively (transitive closure)
  const downstreamSet = new Set<string>();
  const queue = [...(prerequisiteGraph.get(conceptName) || [])];

  while (queue.length > 0) {
    const next = queue.shift()!;
    if (!downstreamSet.has(next) && next !== conceptName) {
      downstreamSet.add(next);
      const nextChildren = prerequisiteGraph.get(next) || [];
      for (const child of nextChildren) {
        if (!downstreamSet.has(child)) {
          queue.push(child);
        }
      }
    }
  }

  const downstreamList = Array.from(downstreamSet);
  const downstream_count = downstreamList.length;

  // Mean importance based on difficulty/degree of downstream targets
  let importanceSum = 0;
  for (const depName of downstreamList) {
    const dep = conceptMap.get(depName);
    const depWeight = dep ? (0.6 + dep.difficulty * 0.1) : 1.0;
    importanceSum += depWeight;
  }
  const mean_importance = downstream_count > 0 ? importanceSum / downstream_count : 1.0;

  const unmastered_gap = Math.max(0.0, 1.0 - concept.confidence);
  const rawScore = unmastered_gap * downstream_count * mean_importance;
  const score = Math.round(rawScore * 100) / 100;

  return {
    score,
    breakdown: {
      unmastered_gap: Math.round(unmastered_gap * 100) / 100,
      downstream_dependency_count: downstream_count,
      mean_dependency_importance: Math.round(mean_importance * 100) / 100,
      downstream_concepts: downstreamList,
    },
  };
}

/**
 * 4. Opportunity Score: Pure function
 * Weighted sum of normalized:
 * knowledge_gap, forgetting_risk, prerequisite_importance, downstream_impact, goal_relevance, (1 - confidence).
 * Returns contributions per factor so UI can show a "Why?" explanation.
 */
export function computeOpportunityScore(
  concept: Concept,
  factors: {
    knowledge_gap: number;           // 0.0 - 1.0 (has missing or weak prerequisites)
    downstream_impact: number;       // 0.0 - 1.0 (normalized impact on downstream concepts)
    prerequisite_importance: number; // 0.0 - 1.0 (criticality as a prerequisite)
    goal_relevance: number;          // 0.0 - 1.0 (alignment with user focus goal)
  },
  config: IntelligenceConfig = DEFAULT_CONFIG
): { score: number; breakdown: OpportunityBreakdown } {
  const w = config.opportunity_weights;
  const unmastered_gap = Math.max(0.0, 1.0 - concept.confidence);
  const forgetting_risk = Math.max(0.0, concept.forgetting_risk);
  const knowledge_gap = Math.min(1.0, Math.max(0.0, factors.knowledge_gap));
  const prereq_imp = Math.min(1.0, Math.max(0.0, factors.prerequisite_importance));
  const downstream_imp = Math.min(1.0, Math.max(0.0, factors.downstream_impact));
  const goal_rel = Math.min(1.0, Math.max(0.0, factors.goal_relevance));

  const contributions: OpportunityContribution[] = [
    {
      factor: 'forgetting_risk',
      label: 'Estimated Forgetting Probability',
      value: Math.round(forgetting_risk * 100) / 100,
      weight: w.forgetting_risk,
      weighted_score: Math.round(forgetting_risk * w.forgetting_risk * 100) / 100,
      explanation: forgetting_risk > 0.6 
        ? `High estimated forgetting probability (${Math.round(forgetting_risk * 100)}%); retention decay is accelerating.`
        : `Memory stability is moderate; timely reinforcement preserves cognitive durability.`,
    },
    {
      factor: 'knowledge_gap',
      label: 'Prerequisite Dependency Gap',
      value: Math.round(knowledge_gap * 100) / 100,
      weight: w.knowledge_gap,
      weighted_score: Math.round(knowledge_gap * w.knowledge_gap * 100) / 100,
      explanation: knowledge_gap > 0.5 
        ? 'Directly unblocks fragile dependencies or targets an identified structural gap.'
        : 'Prerequisite foundations are partially established.',
    },
    {
      factor: 'prerequisite_importance',
      label: 'Foundational Criticality',
      value: Math.round(prereq_imp * 100) / 100,
      weight: w.prerequisite_importance,
      weighted_score: Math.round(prereq_imp * w.prerequisite_importance * 100) / 100,
      explanation: prereq_imp > 0.6 
        ? 'Acts as a critical bridge concept required by multiple advanced topics.'
        : 'Moderate foundational connectivity.',
    },
    {
      factor: 'downstream_impact',
      label: 'Downstream Unlock Impact',
      value: Math.round(downstream_imp * 100) / 100,
      weight: w.downstream_impact,
      weighted_score: Math.round(downstream_imp * w.downstream_impact * 100) / 100,
      explanation: downstream_imp > 0.5 
        ? 'Mastering this topic directly elevates confidence in multiple downstream nodes.'
        : 'Impact localized to immediate leaf topics.',
    },
    {
      factor: 'unmastered_gap',
      label: 'Mastery Room For Growth',
      value: Math.round(unmastered_gap * 100) / 100,
      weight: w.unmastered_gap,
      weighted_score: Math.round(unmastered_gap * w.unmastered_gap * 100) / 100,
      explanation: `Current mastery is ${Math.round(concept.confidence * 100)}%, leaving significant room for rapid gains.`,
    },
  ];

  let rawTotal = 0;
  for (const c of contributions) {
    rawTotal += c.weighted_score;
  }
  const score = Math.round(Math.min(1.0, Math.max(0.0, rawTotal)) * 1000) / 1000;

  // Build the "Why?" checklist for user UI
  const why_list: string[] = [];
  if (forgetting_risk >= 0.55) {
    why_list.push(`Estimated forgetting probability reached ${Math.round(forgetting_risk * 100)}% (stability threshold reached)`);
  }
  if (knowledge_gap >= 0.5) {
    why_list.push('Identified as an active structural gap blocking advanced progression');
  }
  if (prereq_imp >= 0.6) {
    why_list.push('High foundational centrality in the semantic knowledge graph');
  }
  if (downstream_imp >= 0.6) {
    why_list.push('Unblocks understanding for high-value downstream concepts');
  }
  if (concept.confidence < 0.35) {
    why_list.push(`Low verified mastery (${Math.round(concept.confidence * 100)}%) creates cognitive interference`);
  }
  if (why_list.length === 0) {
    why_list.push('Balanced spaced practice maintains high long-term retention');
  }

  return {
    score,
    breakdown: {
      knowledge_gap,
      forgetting_risk,
      prerequisite_importance: prereq_imp,
      downstream_impact: downstream_imp,
      goal_relevance: goal_rel,
      score,
      contributions,
      why_list,
    },
  };
}

/**
 * 5. Knowledge Gap Detection:
 * Given a target concept, traverse upstream prerequisites (up to depth 4).
 * Identify nodes with confidence < 0.55 as weak / broken prerequisite links.
 */
export function detectKnowledgeGaps(
  targetName: string,
  conceptMap: Map<string, Concept>,
  prerequisitesOf: Map<string, Array<{ name: string; type: string }>>,
  maxDepth = 4
): KnowledgeGap {
  const target = conceptMap.get(targetName);
  const critical_path: GapPathNode[] = [];
  const visited = new Set<string>();

  function traverse(currentName: string, depth: number) {
    if (depth > maxDepth || visited.has(currentName)) return;
    visited.add(currentName);

    const c = conceptMap.get(currentName);
    if (!c) return;

    const is_weak = c.confidence < 0.50;
    critical_path.push({
      name: c.name,
      confidence: c.confidence,
      difficulty: c.difficulty,
      forgetting_risk: c.forgetting_risk,
      is_weak,
      depth,
    });

    const prereqs = prerequisitesOf.get(currentName) || [];
    for (const p of prereqs) {
      traverse(p.name, depth + 1);
    }
  }

  traverse(targetName, 0);

  const weakNodes = critical_path.filter((n) => n.is_weak && n.name !== targetName);
  const weakCount = weakNodes.length;

  let severity: KnowledgeGap['gap_severity'] = 'LOW';
  if (weakCount >= 3 || (weakNodes.some((w) => w.confidence < 0.35))) {
    severity = 'CRITICAL';
  } else if (weakCount >= 2) {
    severity = 'HIGH';
  } else if (weakCount === 1) {
    severity = 'MEDIUM';
  }

  const weakest = weakNodes.sort((a, b) => a.confidence - b.confidence)[0] || {
    name: targetName,
    confidence: target?.confidence || 0.5,
  };

  return {
    target: targetName,
    total_prerequisites: Math.max(0, critical_path.length - 1),
    weak_prerequisites_count: weakCount,
    gap_severity: severity,
    critical_path,
    recommended_bridge: {
      start_concept: weakest.name,
      target_concept: targetName,
      action_type: weakest.confidence < 0.35 ? 'STUDY' : 'QUIZ',
      priority: severity === 'CRITICAL' ? 1 : severity === 'HIGH' ? 2 : 3,
      estimated_minutes: weakest.confidence < 0.35 ? 20 : 10,
      reason: `Concept "${weakest.name}" has verified mastery of only ${Math.round(weakest.confidence * 100)}%, creating a knowledge barrier for understanding "${targetName}".`,
    },
  };
}
