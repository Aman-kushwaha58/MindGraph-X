"""
Unit Tests for Confidence Model
Verifies pure formula behavior and factor breakdown
Formula:
Confidence = 0.30*quiz + 0.20*revision_freq + 0.15*recency + 0.20*practical_usage + 0.15*learning_activity
"""

import unittest
from ai.confidence_model import compute_confidence


class TestConfidenceModel(unittest.TestCase):
    def test_confidence_zero_activity(self):
        signals = {
            "quiz_accuracy": 0.0,
            "n_revisions": 0,
            "days_since_revision": 100.0,
            "usage_count": 0,
            "learning_count": 0,
        }
        result = compute_confidence(signals)
        self.assertGreaterEqual(result["score"], 0.0)
        self.assertLessEqual(result["score"], 0.05)
        self.assertIn("breakdown", result)
        self.assertEqual(result["breakdown"]["quiz"], 0.0)

    def test_confidence_perfect_mastery(self):
        signals = {
            "quiz_accuracy": 1.0,
            "n_revisions": 5,
            "days_since_revision": 0.0,
            "usage_count": 8,
            "learning_count": 6,
        }
        result = compute_confidence(signals)
        self.assertEqual(result["score"], 1.0)
        self.assertEqual(result["breakdown"]["quiz"], 1.0)
        self.assertEqual(result["breakdown"]["revision_freq"], 1.0)
        self.assertEqual(result["breakdown"]["recency"], 1.0)

    def test_attention_bottleneck_evaluation(self):
        """
        Verifies that Attention signals produce ~27% confidence as specified by Phase 6.
        """
        signals = {
            "quiz_accuracy": 0.25,
            "n_revisions": 1,
            "days_since_revision": 16.0,
            "usage_count": 2,
            "learning_count": 2,
        }
        result = compute_confidence(signals)
        self.assertTrue(0.24 <= result["score"] <= 0.29)
        self.assertIn("weights", result["breakdown"])


if __name__ == "__main__":
    unittest.main()
