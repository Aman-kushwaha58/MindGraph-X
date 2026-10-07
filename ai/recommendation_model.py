"""
Opportunity & Recommendation Engine for MindGraph X
Non-negotiable Rule #2: Pure Python function. No DB calls inside.
Non-negotiable Rule #3: Every score returns a per-factor breakdown and 'why' contributions list.

Formula:
Opportunity score = weighted sum of normalized:
  knowledge_gap, forgetting_risk, prerequisite_importance, downstream_impact, goal_relevance, (1 - confidence)
"""

from typing import Dict, List, Any

DEFAULT_OPPORTUNITY_WEIGHTS = {
    "knowledge_gap": 0.25,
    "forgetting_risk": 0.25,
    "prerequisite_importance": 0.20,
    "downstream_impact": 0.15,
    "goal_relevance": 0.05,
    "unmastered_gap": 0.10,
}


def compute_opportunity_score(
    concept_name: str,
    confidence: float,
    forgetting_risk: float,
    factors: Dict[str, float],
    weights: Dict[str, float] = None,
) -> Dict[str, Any]:
    """
    Computes opportunity ranking score with per-factor contributions for transparency.
    """
    w = weights or DEFAULT_OPPORTUNITY_WEIGHTS

    conf = min(1.0, max(0.0, float(confidence)))
    unmastered_gap = max(0.0, 1.0 - conf)
    risk = min(1.0, max(0.0, float(forgetting_risk)))
    gap = min(1.0, max(0.0, float(factors.get("knowledge_gap", 0.0))))
    prereq_imp = min(1.0, max(0.0, float(factors.get("prerequisite_importance", 0.0))))
    downstream_imp = min(1.0, max(0.0, float(factors.get("downstream_impact", 0.0))))
    goal_rel = min(1.0, max(0.0, float(factors.get("goal_relevance", 0.0))))

    contributions = [
        {
            "factor": "forgetting_risk",
            "label": "Estimated Forgetting Probability",
            "value": round(risk, 2),
            "weight": w["forgetting_risk"],
            "weighted_score": round(risk * w["forgetting_risk"], 3),
            "explanation": f"Estimated forgetting probability is {int(risk * 100)}%; requires active recall.",
        },
        {
            "factor": "knowledge_gap",
            "label": "Prerequisite Dependency Gap",
            "value": round(gap, 2),
            "weight": w["knowledge_gap"],
            "weighted_score": round(gap * w["knowledge_gap"], 3),
            "explanation": "Identified as a weak prerequisite link on active learning paths.",
        },
        {
            "factor": "prerequisite_importance",
            "label": "Foundational Centrality",
            "value": round(prereq_imp, 2),
            "weight": w["prerequisite_importance"],
            "weighted_score": round(prereq_imp * w["prerequisite_importance"], 3),
            "explanation": "Serves as an essential prerequisite for higher-level topics.",
        },
        {
            "factor": "downstream_impact",
            "label": "Downstream Impact",
            "value": round(downstream_imp, 2),
            "weight": w["downstream_impact"],
            "weighted_score": round(downstream_imp * w["downstream_impact"], 3),
            "explanation": "Mastering this concept elevates confidence across downstream dependents.",
        },
        {
            "factor": "unmastered_gap",
            "label": "Mastery Room For Growth",
            "value": round(unmastered_gap, 2),
            "weight": w["unmastered_gap"],
            "weighted_score": round(unmastered_gap * w["unmastered_gap"], 3),
            "explanation": f"Current verified mastery is {int(conf * 100)}%, providing immediate upside.",
        },
    ]

    raw_total = sum(c["weighted_score"] for c in contributions)
    score = round(min(1.0, max(0.0, raw_total)), 3)

    # Build the "Why?" checklist for UI cards
    why_list: List[str] = []
    if risk >= 0.55:
        why_list.append(f"Estimated forgetting probability reached {int(risk * 100)}% (stability threshold)")
    if gap >= 0.50:
        why_list.append("Identified as an active structural gap blocking advanced progression")
    if prereq_imp >= 0.60:
        why_list.append("High foundational centrality in semantic knowledge graph")
    if downstream_imp >= 0.50:
        why_list.append("Unblocks understanding for high-value downstream concepts")
    if conf < 0.35:
        why_list.append(f"Low verified mastery ({int(conf * 100)}%) creates cognitive interference")
    if not why_list:
        why_list.append("Spaced practice maintains cognitive stability and long-term retention")

    return {
        "score": score,
        "contributions": contributions,
        "why_list": why_list,
        "breakdown": {
            "knowledge_gap": gap,
            "forgetting_risk": risk,
            "prerequisite_importance": prereq_imp,
            "downstream_impact": downstream_imp,
            "goal_relevance": goal_rel,
            "unmastered_gap": unmastered_gap,
            "weights": {**w},
        },
    }
