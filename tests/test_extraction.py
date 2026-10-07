"""
Unit Tests for Relationship Extraction & Validation
Non-negotiable Rule #5: Constrained strictly to prerequisite_of, related_to, part_of, depends_on.
"""

import unittest
from ai.concept_extraction import validate_extracted_payload, normalize_term


class TestConceptExtraction(unittest.TestCase):
    def test_allowed_relationships_accepted(self):
        payload = {
            "concepts": [
                {"name": "Attention", "difficulty": 4},
                {"name": "Transformer", "difficulty": 4},
            ],
            "relations": [
                {"source": "Attention", "target": "Transformer", "type": "prerequisite_of"},
                {"source": "Transformer", "target": "Attention", "type": "depends_on"},
                {"source": "Transformer", "target": "Attention", "type": "part_of"},
                {"source": "Attention", "target": "Transformer", "type": "related_to"},
            ],
        }
        is_valid, _, clean = validate_extracted_payload(payload)
        self.assertTrue(is_valid)
        self.assertEqual(len(clean["relations"]), 4)

    def test_invalid_relationships_rejected(self):
        payload = {
            "concepts": [
                {"name": "Attention", "difficulty": 4},
                {"name": "Transformer", "difficulty": 4},
            ],
            "relations": [
                {"source": "Attention", "target": "Transformer", "type": "causes"}, # INVALID
                {"source": "Attention", "target": "Transformer", "type": "used_by"}, # INVALID
                {"source": "Attention", "target": "Transformer", "type": "prerequisite_of"}, # VALID
            ],
        }
        is_valid, _, clean = validate_extracted_payload(payload)
        self.assertTrue(is_valid)
        # Only prerequisite_of accepted
        self.assertEqual(len(clean["relations"]), 1)
        self.assertEqual(clean["relations"][0]["type"], "prerequisite_of")

    def test_generic_terms_filtered(self):
        self.assertEqual(normalize_term("Transformers!"), "transformer")
        self.assertEqual(normalize_term("Categories"), "category")


if __name__ == "__main__":
    unittest.main()
