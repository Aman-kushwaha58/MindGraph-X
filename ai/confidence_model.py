"""
Confidence Model for MindGraph X
Non-negotiable Rule #2: Pure Python function. No DB calls inside.
Non-negotiable Rule #3: Every score returns a per-factor breakdown for the UI "Why?" explanation.

Formula:
Confidence = 0.30*quiz + 0.20*revision_freq + 0.15*recency + 0.20*practical_usage + 0.15*learning_activity (each 0-1)
"""

import math
from typing import Dict, Any

DEFAULT_CONFIDENCE_WEIGHTS = {
    "quiz": 0.30,
    "revision_freq": 0.20,
    "recency": 0.15,
    "practical_usage": 0.20,
    "learning_activity": 0.15,
}


def compute_confidence(
    signals: Dict[str, Any],
    weights: Dict[str, float] = None,
) -> Dict[str, Any]:
    """
    Computes concept confidence score from 5 normalized behavioral signals.
    
    signals:
      quiz_accuracy: float [0-1]
      n_revisions: int (count of revisions completed)
      days_since_revision: float (elapsed days since last revision)
      usage_count: int (times referenced in notes/problems/mentor)
      learning_count: int (study sessions count)
    """
    w = weights or DEFAULT_CONFIDENCE_WEIGHTS

    quiz = min(1.0, max(0.0, float(signals.get("quiz_accuracy", 0.0))))
    
    # 5+ revisions reaches normalized 1.0
    n_rev = float(signals.get("n_revisions", 0))
    revision_freq = min(1.0, max(0.0, n_rev / 5.0))

    # Recency: exponential decay with half-life ~10-14 days
    days = float(signals.get("days_since_revision", 0.0))
    recency = min(1.0, max(0.0, math.exp(-days / 14.0)))

    # Practical usage: 8+ references reaches 1.0
    usage = float(signals.get("usage_count", 0))
    practical_usage = min(1.0, max(0.0, usage / 8.0))

    # Learning activity: 6+ sessions reaches 1.0
    sessions = float(signals.get("learning_count", 0))
    learning_activity = min(1.0, max(0.0, sessions / 6.0))

    raw_score = (
        w["quiz"] * quiz
        + w["revision_freq"] * revision_freq
        + w["recency"] * recency
        + w["practical_usage"] * practical_usage
        + w["learning_activity"] * learning_activity
    )
    score = round(min(1.0, max(0.0, raw_score)), 3)

    return {
        "score": score,
        "breakdown": {
            "quiz": round(quiz, 3),
            "revision_freq": round(revision_freq, 3),
            "recency": round(recency, 3),
            "practical_usage": round(practical_usage, 3),
            "learning_activity": round(learning_activity, 3),
            "weights": {**w},
        },
    }
