"""
Bottleneck Detection Model for MindGraph X
Non-negotiable Rule #2: Pure Python function. No DB calls inside.
Non-negotiable Rule #3: Every score returns a per-factor breakdown for the UI "Why?" explanation.

Formula:
Bottleneck score = (1 - confidence) * downstream_dependency_count * mean_dependency_importance
"""

from typing import Dict, List, Set, Any


def compute_bottleneck_score(
    concept_name: str,
    confidence: float,
    downstream_concepts: List[str],
    downstream_difficulties: Dict[str, int] = None,
) -> Dict[str, Any]:
    """
    Computes structural bottleneck score for a concept based on unmastered gap
    and transitive downstream dependencies blocked in the semantic knowledge graph.
    """
    conf = min(1.0, max(0.0, float(confidence)))
    unmastered_gap = max(0.0, 1.0 - conf)
    downstream_count = len(downstream_concepts)

    diff_map = downstream_difficulties or {}
    importance_sum = 0.0
    for dep in downstream_concepts:
        diff = diff_map.get(dep, 3)
        # Weight by difficulty factor (0.6 + diff * 0.1)
        importance_sum += 0.6 + (diff * 0.1)

    mean_importance = (importance_sum / downstream_count) if downstream_count > 0 else 1.0
    raw_score = unmastered_gap * downstream_count * mean_importance
    score = round(raw_score, 2)

    return {
        "score": score,
        "is_bottleneck": score >= 2.0,
        "breakdown": {
            "confidence": conf,
            "unmastered_gap": round(unmastered_gap, 3),
            "downstream_dependency_count": downstream_count,
            "mean_dependency_importance": round(mean_importance, 2),
            "downstream_concepts": downstream_concepts,
            "formula": "(1 - confidence) * downstream_count * mean_importance",
        },
    }
