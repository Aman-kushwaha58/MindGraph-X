"""
Unit Tests for Forgetting Risk Model
Formula:
stability = base * (1+n_revisions) * (0.5+confidence) * (1+usage) / (0.5 + difficulty/5)
retention = exp(-days_since_revision / stability)
forgetting_risk = 1 - retention
"""

import unittest
from ai.forgetting_model import compute_forgetting_risk


class TestForgettingModel(unittest.TestCase):
    def test_immediate_revision_zero_risk(self):
        result = compute_forgetting_risk(
            days_since_revision=0.0,
            n_revisions=3,
            confidence=0.8,
            usage_count=5,
            difficulty=3,
        )
        self.assertEqual(result["risk"], 0.0)
        self.assertEqual(result["retention"], 1.0)
        self.assertGreater(result["stability"], 5.0)

    def test_long_delay_high_risk(self):
        result = compute_forgetting_risk(
            days_since_revision=60.0,
            n_revisions=0,
            confidence=0.3,
            usage_count=0,
            difficulty=4,
        )
        self.assertGreater(result["risk"], 0.85)
        self.assertLess(result["retention"], 0.15)

    def test_wording_disclaimer_present(self):
        result = compute_forgetting_risk(
            days_since_revision=7.0,
            n_revisions=1,
            confidence=0.5,
            usage_count=2,
        )
        # Non-negotiable rule #7: estimates forgetting probability
        self.assertIn("estimates forgetting probability", result["breakdown"]["wording_disclaimer"].lower())


if __name__ == "__main__":
    unittest.main()
