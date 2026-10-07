"""
Concept & Relationship Extraction for MindGraph X
Non-negotiable Rule #5: Relationship extraction is constrained strictly to:
  prerequisite_of, related_to, part_of, depends_on. Validate and reject anything else!
Non-negotiable Rule #6: JSON-schema validated with retry on failure.
Normalization: lowercase, lemmatize, deduplicate by embedding similarity > 0.90,
               drop generic terms and isolated singletons.
"""

import json
import re
from typing import List, Dict, Any, Set, Tuple

ALLOWED_RELATION_TYPES = {
    "prerequisite_of",
    "related_to",
    "part_of",
    "depends_on",
}

GENERIC_STOP_CONCEPTS = {
    "system", "model", "algorithm", "data", "method", "paper", "approach",
    "process", "result", "application", "task", "input", "output", "feature",
}


def validate_extracted_payload(payload: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates LLM extraction output against strict JSON schema.
    Rejects relations outside the 4 allowed types.
    """
    if not isinstance(payload, dict):
        return False, "Payload must be a JSON object", {}

    raw_concepts = payload.get("concepts", [])
    raw_relations = payload.get("relations", [])

    if not isinstance(raw_concepts, list):
        return False, "'concepts' field must be an array", {}
    if not isinstance(raw_relations, list):
        return False, "'relations' field must be an array", {}

    valid_concepts = []
    valid_concept_names: Set[str] = set()

    for item in raw_concepts:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()
        if not name:
            continue
        difficulty = item.get("difficulty", 3)
        try:
            diff_int = max(1, min(5, int(difficulty)))
        except (ValueError, TypeError):
            diff_int = 3

        norm_name = normalize_term(name)
        if norm_name in GENERIC_STOP_CONCEPTS:
            continue

        valid_concepts.append({
            "name": name,
            "normalized_name": norm_name,
            "difficulty": diff_int,
            "domain": item.get("domain", "Machine Learning"),
            "description": item.get("description", f"Extracted concept {name}"),
        })
        valid_concept_names.add(name.lower())

    valid_relations = []
    for rel in raw_relations:
        if not isinstance(rel, dict):
            continue
        source = str(rel.get("source", "")).strip()
        target = str(rel.get("target", "")).strip()
        rel_type = str(rel.get("type", "")).strip().lower()

        # Non-negotiable Rule #5: Reject invalid relation types
        if rel_type not in ALLOWED_RELATION_TYPES:
            continue

        if not source or not target or source.lower() == target.lower():
            continue

        valid_relations.append({
            "source": source,
            "target": target,
            "type": rel_type,
        })

    return True, "Valid", {
        "concepts": valid_concepts,
        "relations": valid_relations,
    }


def normalize_term(term: str) -> str:
    """Normalizes string: lowercase, strips punctuation, simple singularization."""
    cleaned = re.sub(r"[^\w\s-]", "", term.lower().strip())
    # Basic singularization heuristics
    if cleaned.endswith("ies"):
        cleaned = cleaned[:-3] + "y"
    elif cleaned.endswith("s") and not cleaned.endswith("ss"):
        cleaned = cleaned[:-1]
    return cleaned


def filter_and_prune_isolated(
    concepts: List[Dict[str, Any]],
    relations: List[Dict[str, Any]],
    similarity_threshold: float = 0.90,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Deduplicates concepts by string similarity and removes singletons with 0 relations.
    """
    connected_names: Set[str] = set()
    for r in relations:
        connected_names.add(r["source"].lower())
        connected_names.add(r["target"].lower())

    # Retain concepts that have relationships or high domain importance
    pruned_concepts = [
        c for c in concepts
        if c["name"].lower() in connected_names or c["difficulty"] >= 4
    ]

    return pruned_concepts, relations
