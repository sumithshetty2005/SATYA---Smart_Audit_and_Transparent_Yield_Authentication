"""Layer 4 Task 4: Reranking & Evidence Validation for Regulatory Chunks.

Reranks candidate passages using cross-encoder / RRF scoring to retain top-K evidence snippets.
Validates regulatory provenance:
- Verifies edition currency (e.g. active 2024-2027 APH cycle).
- Evaluates active conditions and applicable statutory concessions/exceptions.
- Validates program applicability against the applicant's declared academic discipline.
"""

import logging
import re
from typing import List, Optional, Tuple

from app.knowledge.config import RERANK_TOP_K
from app.knowledge.ingest_aph import APHChunk
from app.schemas.compliance import EvidenceSnippet, InstitutionFacts

logger = logging.getLogger(__name__)


class EvidenceReranker:
    """Reranks candidate passages and performs provenance validation for compliance orchestration."""

    def __init__(self, top_k: int = RERANK_TOP_K) -> None:
        self.top_k = top_k

    def score_passage(
        self,
        query: str,
        chunk: APHChunk,
        base_rrf_score: float,
        institution_facts: Optional[InstitutionFacts] = None,
    ) -> float:
        """Compute reranking score combining RRF rank, keyword exact matches, and fact alignment."""
        score = base_rrf_score * 10.0

        q_lower = query.lower()
        chunk_text = chunk.text.lower()
        title_lower = chunk.title.lower()

        # Boost exact ratios (1:15, 1:20, 1:2:6)
        ratios = re.findall(r"\d+:\d+(?::\d+)?", q_lower)
        for r in ratios:
            if r in chunk_text:
                score += 2.5

        # Boost section and clause identifiers
        sec_matches = re.findall(r"\b\d+\.\d+\b", q_lower)
        for s in sec_matches:
            if s in chunk_text or s in chunk.section_id:
                score += 2.0

        # Boost numeric land or area figures (7.5, 2.5, 1.5, 4000, 8000)
        nums = re.findall(r"\b\d+(?:\.\d+)?\b", q_lower)
        for n in nums:
            if n in chunk_text:
                score += 0.5

        # Boost program relevance
        if institution_facts:
            prog_words = institution_facts.programme.lower().split()
            for pw in prog_words:
                if len(pw) > 3 and pw in chunk_text:
                    score += 0.75

            # Boost location type relevance
            loc = institution_facts.location_type.lower()
            if loc in chunk_text:
                score += 1.0

        # Normalize score to 0.0 - 1.0 range
        normalized_score = float(min(1.0, max(0.05, score / 15.0)))
        return round(normalized_score, 4)

    def validate_provenance(
        self,
        chunk: APHChunk,
        institution_facts: Optional[InstitutionFacts] = None,
    ) -> Tuple[bool, bool, bool, str]:
        """Validate evidence provenance: currency, program applicability, and active conditions.

        Returns: (currency_verified, program_applicable, is_valid, validation_notes)
        """
        notes: List[str] = []

        # 1. Edition Currency Check
        target_cycle = institution_facts.edition_year if institution_facts else "2024-2027"
        currency_verified = chunk.edition_year == target_cycle
        if currency_verified:
            notes.append(f"Currency confirmed: active under APH {chunk.edition_year}")
        else:
            notes.append(f"Currency mismatch: clause edition {chunk.edition_year} != target {target_cycle}")

        # 2. Program Applicability Check
        program_applicable = True
        if institution_facts:
            target_prog = institution_facts.programme.lower()
            chunk_text = chunk.text.lower()

            # If clause is program-specific, verify that it matches
            if "engineering" in chunk_text and "management" not in chunk_text:
                program_applicable = "engineering" in target_prog or "technology" in target_prog
            elif "management" in chunk_text and "engineering" not in chunk_text:
                program_applicable = "management" in target_prog or "mba" in target_prog or "pgdm" in target_prog
            elif "pharmacy" in chunk_text and "engineering" not in chunk_text:
                program_applicable = "pharmacy" in target_prog

            if program_applicable:
                notes.append(f"Program applicable to '{institution_facts.programme}'")
            else:
                notes.append(f"Program specificity notice: clause mentions other disciplines")

        # 3. Active Conditions & Exceptions Check
        if institution_facts:
            loc = institution_facts.location_type.lower()
            if "mega" in loc or "metro" in loc:
                if "clause 2.1.4" in chunk.text.lower() or "mega" in chunk.text.lower():
                    notes.append("Active Concession: Mega City 50% land area relaxation applicable (Clause 2.1.4)")

            if "practice" in chunk.text.lower() or "adjunct" in chunk.text.lower():
                notes.append("Active Exception: Up to 20% Professor of Practice waiver admissible (Clause 3.2.5)")

        is_valid = currency_verified and program_applicable
        return currency_verified, program_applicable, is_valid, "; ".join(notes)

    def rerank_and_validate(
        self,
        query: str,
        candidates: List[Tuple[APHChunk, float]],
        institution_facts: Optional[InstitutionFacts] = None,
        top_k: Optional[int] = None,
    ) -> List[EvidenceSnippet]:
        """Rerank candidates and validate each snippet's provenance before dispatch to LLM."""
        k = top_k or self.top_k
        scored_snippets: List[Tuple[float, EvidenceSnippet]] = []

        for chunk, rrf_score in candidates:
            rerank_score = self.score_passage(query, chunk, rrf_score, institution_facts)
            currency_ok, prog_ok, is_valid, notes = self.validate_provenance(chunk, institution_facts)

            snippet = EvidenceSnippet(
                chunk_id=chunk.chunk_id,
                title=chunk.title,
                edition_year=chunk.edition_year,
                section_id=chunk.section_id,
                clause_reference=chunk.clause_reference,
                page_number=chunk.page_number,
                table_context=chunk.table_context,
                text=chunk.text,
                rrf_score=round(rrf_score, 5),
                rerank_score=rerank_score,
                currency_verified=currency_ok,
                program_applicable=prog_ok,
                is_valid=is_valid,
                validation_notes=notes,
            )
            scored_snippets.append((rerank_score, snippet))

        # Sort descending by rerank score
        scored_snippets.sort(key=lambda x: x[0], reverse=True)
        return [snip for _, snip in scored_snippets[:k]]


# Global reranker instance
reranker = EvidenceReranker()
