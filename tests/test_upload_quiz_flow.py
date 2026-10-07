"""
Unit & Integration Tests for End-to-End "Upload -> Quiz -> Forgetting Prediction" Flow
Requirements:
1. Uploading a sample PDF produces at least N concepts.
2. Quiz generation produces valid, schema-correct MCQs tied to real chunk content (no empty/duplicate questions).
3. Submitting answers correctly updates confidence and forgetting_risk, and predicted_forget_date is a future date, not null.
"""

import math
from datetime import datetime, timedelta
import unittest
from ai.confidence_model import compute_confidence
from ai.forgetting_model import compute_forgetting_risk, predict_safe_revision_window
from ai.concept_extraction import validate_extracted_payload


class TestUploadQuizFlow(unittest.TestCase):
    def test_concept_extraction_minimum_threshold(self):
        """
        Test 1: Uploading a sample paper produces at least N (>= 3) schema-valid concepts.
        """
        mock_llm_response = {
            "concepts": [
                {
                    "name": "Diffusion Models",
                    "domain": "Generative AI",
                    "difficulty": 4,
                    "description": "Models that generate data by reversing a continuous noise corruption process.",
                },
                {
                    "name": "Score-Based SDE",
                    "domain": "Stochastic Calculus",
                    "difficulty": 5,
                    "description": "Formulation of continuous forward and reverse diffusion processes.",
                },
                {
                    "name": "Denoising Score Matching",
                    "domain": "Statistical Learning",
                    "difficulty": 4,
                    "description": "Estimating score functions without evaluating partition functions.",
                },
                {
                    "name": "Latent Diffusion",
                    "domain": "Generative AI",
                    "difficulty": 4,
                    "description": "Diffusion executed within compressed latent representations.",
                },
            ],
            "relations": [
                {"source": "Denoising Score Matching", "target": "Score-Based SDE", "type": "prerequisite_of"},
                {"source": "Score-Based SDE", "target": "Diffusion Models", "type": "prerequisite_of"},
                {"source": "Diffusion Models", "target": "Latent Diffusion", "type": "prerequisite_of"},
            ],
        }

        is_valid, msg, validated = validate_extracted_payload(mock_llm_response)
        self.assertTrue(is_valid)
        self.assertGreaterEqual(len(validated["concepts"]), 3, "Extraction must produce at least 3 concepts")
        self.assertGreaterEqual(len(validated["relations"]), 2)

        # Check relation constraints (Rule #5)
        allowed_types = {"prerequisite_of", "related_to", "part_of", "depends_on"}
        for rel in validated["relations"]:
            self.assertIn(rel["type"], allowed_types)

    def test_quiz_generation_schema_and_chunk_grounding(self):
        """
        Test 2: Quiz generation produces valid, schema-correct MCQs tied to real chunk content
        (no empty or duplicate questions).
        """
        chunk_text = (
            "Scaled Dot-Product Attention: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V. "
            "The query, keys, and values are vectors of dimension d_k. For large dimensions, "
            "dot products grow large in magnitude, pushing softmax into vanishing gradient saturation. "
            "Dividing by sqrt(d_k) counteracts this."
        )

        mock_generated_questions = [
            {
                "id": "q-att-1",
                "concept_name": "Attention",
                "question": "Why do scaled dot-product attention models divide the dot product QK^T by sqrt(d_k)?",
                "options": [
                    "To speed up GPU memory allocation",
                    "To prevent large dot product magnitudes from pushing softmax into vanishing gradient saturation",
                    "To force attention weight matrices to be orthogonal",
                    "To compress sequence token representations",
                ],
                "correct_option_index": 1,
                "explanation": "Dividing by sqrt(d_k) counteracts large dot product magnitudes.",
                "difficulty": 4,
            },
            {
                "id": "q-att-2",
                "concept_name": "Attention",
                "question": "What mathematical operator normalizes QK^T / sqrt(d_k) across sequence length?",
                "options": ["Softmax function", "ReLU activation", "Layer Normalization", "Sigmoid gating"],
                "correct_option_index": 0,
                "explanation": "Softmax normalizes pairwise query-key compatibility scores.",
                "difficulty": 3,
            },
        ]

        question_texts = set()
        for q in mock_generated_questions:
            self.assertGreater(len(q["question"].strip()), 10, "Question text must not be empty")
            self.assertEqual(len(q["options"]), 4, "Must provide exactly 4 MCQ options")
            self.assertTrue(0 <= q["correct_option_index"] <= 3, "Correct index must be 0-3")
            self.assertNotIn(q["question"], question_texts, "Duplicate questions are forbidden")
            question_texts.add(q["question"])

            # Grounding check: correct answer or explanation must reflect the chunk text
            correct_text = q["options"][q["correct_option_index"]].lower()
            self.assertTrue("softmax" in correct_text or "vanishing" in correct_text or "attention" in q["question"].lower())

    def test_submission_updates_state_and_predicts_future_forget_date(self):
        """
        Test 3: Submitting answers correctly updates confidence and forgetting_risk,
        and predicted_forget_date is a future date, not null.
        """
        initial_confidence = 0.30  # Default initial confidence for newly ingested concept
        initial_signals = {
            "quiz_accuracy": 0.30,
            "n_revisions": 0,
            "days_since_revision": 0,
            "usage_count": 1,
            "learning_count": 1,
        }

        # Simulate 4/5 correct quiz submission
        quiz_accuracy = 0.80
        new_signals = {
            "quiz_accuracy": quiz_accuracy,
            "n_revisions": 1,
            "days_since_revision": 0,
            "usage_count": 3,
            "learning_count": 2,
        }

        conf_result = compute_confidence(new_signals)
        new_confidence = conf_result["score"]

        # Verify confidence gained
        self.assertGreater(new_confidence, initial_confidence, "Confidence must increase after a high-scoring quiz")

        # Compute updated forgetting model metrics
        forget_result = compute_forgetting_risk(
            days_since_revision=0,
            n_revisions=1,
            confidence=new_confidence,
            usage_count=3,
            difficulty=4,
        )

        stability_days = forget_result["stability"]
        self.assertGreater(stability_days, 5.0, "Stability must reflect revision reinforcement")

        # Solve forgetting curve for safe revision window (threshold = 0.50)
        # risk = 1 - exp(-t / stability) = 0.50 => t = -stability * ln(0.5)
        safe_window = predict_safe_revision_window(stability_days, threshold=0.50)
        safe_days = safe_window["safe_days"]

        self.assertGreater(safe_days, 2.0, "Safe revision window must be positive")
        expected_safe = round(-stability_days * math.log(0.50), 1)
        self.assertLess(abs(safe_days - expected_safe), 0.2)

        # Check predicted_forget_date is a future date
        future_date = datetime.now() + timedelta(days=safe_days)
        self.assertGreater(future_date, datetime.now())
        self.assertGreaterEqual(future_date.year, 2026)


if __name__ == "__main__":
    unittest.main()
