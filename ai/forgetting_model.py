"""
Forgetting Model for MindGraph X
Non-negotiable Rule #2: Pure Python function. No DB calls inside.
Non-negotiable Rule #7: Estimates forgetting probability (not exact prediction).

Formula:
stability = base * (1+n_revisions) * (0.5+confidence) * (1+usage) / (0.5 + difficulty/5)
retention = exp(-days_since_revision / stability)
forgetting_risk = 1 - retention
"""

import math
from typing import Dict, Any

DEFAULT_BASE_STABILITY_DAYS = 7.0


def compute_forgetting_risk(
    days_since_revision: float,
    n_revisions: int,
    confidence: float,
    usage_count: int,
    difficulty: int = 3,
    base_stability_days: float = DEFAULT_BASE_STABILITY_DAYS,
) -> Dict[str, Any]:
    """
    Estimates forgetting probability based on cognitive stability and elapsed days.
    Returns: { risk, retention, stability, breakdown }
    """
    base = float(base_stability_days)
    n_rev = max(0, int(n_revisions))
    conf = min(1.0, max(0.0, float(confidence)))
    usage_norm = min(2.0, max(0.0, float(usage_count) / 10.0))
    diff = min(5, max(1, int(difficulty)))
    days = max(0.0, float(days_since_revision))

    # Stability formula
    numerator = base * (1.0 + n_rev) * (0.5 + conf) * (1.0 + usage_norm)
    denominator = 0.5 + (diff / 5.0)
    stability = max(0.5, numerator / denominator)

    retention = math.exp(-days / stability)
    risk = min(1.0, max(0.0, 1.0 - retention))

    return {
        "risk": round(risk, 3),
        "retention": round(retention, 3),
        "stability": round(stability, 1),
        "breakdown": {
            "base_stability": base,
            "n_revisions": n_rev,
            "confidence": conf,
            "usage": usage_norm,
            "difficulty": diff,
            "stability_days": round(stability, 1),
            "days_since_revision": round(days, 1),
            "retention_rate": round(retention, 3),
            "wording_disclaimer": "Estimates forgetting probability based on spaced cognitive stability decay.",
        },
    }


def predict_safe_revision_window(
    stability_days: float,
    threshold: float = 0.50,
) -> Dict[str, Any]:
    """
    Predicts the safe revision window in days until forgetting risk crosses threshold (default 50%).
    Solved from: risk = 1 - exp(-t / stability) = threshold
    => t = -stability * ln(1 - threshold)
    """
    safe_days = max(0.5, round(-stability_days * math.log(1.0 - threshold), 1))
    return {
        "safe_days": safe_days,
        "threshold": threshold,
    }

