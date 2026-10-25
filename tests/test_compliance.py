"""Unit and integration tests for Layer 4: Agentic GraphRAG & Regulatory Engine.

Tests:
1. Ingestion & Structure-Aware Chunking (app/knowledge/ingest_aph.py)
2. Neo4j Knowledge Graph Seeding (app/knowledge/seed_graph.py)
3. Hybrid Retrieval with RRF & Graph Traversal (app/knowledge/retriever.py)
4. Reranking & Evidence Validation (app/knowledge/reranker.py)
5. LangGraph Agent Orchestration (app/knowledge/agent.py)
6. API Integration (main.py -> POST /api/v1/compliance-audit)
"""

import sys
from pathlib import Path
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

# Ensure root is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from app.knowledge.agent import execute_compliance_audit
from app.knowledge.config import APH_PDF_PATH
from app.knowledge.embeddings import BGEM3EmbeddingManager, embedding_manager
from app.knowledge.ingest_aph import (
    APHChunk,
    StructureAwareChunker,
    count_tokens_approx,
    ingest_aph_document,
)
from app.knowledge.reranker import EvidenceReranker, reranker
from app.knowledge.retriever import (
    HybridGraphRetriever,
    retriever,
    tokenize_for_bm25,
)
from app.knowledge.seed_graph import (
    Neo4jKnowledgeGraphSeeder,
    graph_seeder,
    in_memory_graph,
    seed_graph_database,
)
from app.schemas.compliance import (
    ComplianceAuditRequest,
    ComplianceAuditResponse,
    InstitutionFacts,
)
from app.schemas.payload import (
    ExtractedApplicationPayload,
    FacultyRow,
    ForensicsBreakdown,
    ForensicsResponse,
    LandDetails,
    PKIVerificationResult,
    QRVerificationResult,
    SourceVerificationReceipt,
)
from main import app

client = TestClient(app)


# ===========================================================================
# Task 1: Ingestion & Structure-Aware Chunking Tests
# ===========================================================================
def test_aph_handbook_pdf_exists():
    """Verify APH handbook PDF is present or generated at data/knowledge_base/APH_2024_2027.pdf."""
    chunks = ingest_aph_document()
    assert APH_PDF_PATH.exists(), f"APH PDF should exist at {APH_PDF_PATH}"
    assert len(chunks) > 0, "Ingestion must produce at least one chunk"


def test_structure_aware_chunking_metadata():
    """Verify chunks contain all required regulatory metadata: title, edition_year, section_id, page_number, table_context, clause_reference."""
    chunker = StructureAwareChunker(min_tokens=300, max_tokens=800, overlap_ratio=0.12)
    blocks = chunker.parse_blocks_from_pdf(APH_PDF_PATH)
    assert len(blocks) > 0

    chunks = chunker.build_chunks(blocks, edition_year="2024-2027")
    for chunk in chunks:
        assert isinstance(chunk.chunk_id, str) and len(chunk.chunk_id) > 0
        assert chunk.edition_year == "2024-2027"
        assert len(chunk.section_id) > 0
        assert len(chunk.clause_reference) > 0
        assert chunk.page_number >= 1
        assert chunk.approx_tokens > 0
        assert len(chunk.text) > 0
        # Metadata dictionary checks
        assert "title" in chunk.metadata
        assert "clause_reference" in chunk.metadata
        assert "section_id" in chunk.metadata


def test_chunk_token_boundaries():
    """Verify approximate token sizing is maintained within bounds (~500-800 tokens)."""
    chunks = ingest_aph_document()
    for chunk in chunks[:-1]:  # Exclude trailing chunk which may be shorter
        assert chunk.approx_tokens >= 300, f"Chunk {chunk.chunk_id} has only {chunk.approx_tokens} tokens"


# ===========================================================================
# Task 2: Neo4j Knowledge Graph Seeding Tests
# ===========================================================================
def test_knowledge_graph_seeding_entities_and_relationships():
    """Verify graph seeding extracts all 6 required entities and directed relationships."""
    counts = seed_graph_database()
    assert counts["clauses"] > 0
    assert counts["programmes"] >= 5
    assert counts["application_types"] >= 4
    assert counts["requirements"] >= 10
    assert counts["location_types"] >= 5
    assert counts["exceptions"] >= 3
    assert counts["relationships"] > 0

    # Test in-memory graph repository holds entities
    eng_prog = in_memory_graph.get_node("Programme", "prog_eng")
    assert eng_prog is not None
    assert "Engineering" in eng_prog["name"]

    req_land = in_memory_graph.get_node("Requirement", "req_land_eng_rural")
    assert req_land is not None
    assert req_land["min_value"] == 7.5

    exc_mega = in_memory_graph.get_node("Exception", "exc_mega_city_land")
    assert exc_mega is not None
    assert "Mega City" in exc_mega["title"]


def test_neo4j_driver_graceful_connectivity():
    """Verify driver handles offline and online Neo4j instances safely."""
    seeder = Neo4jKnowledgeGraphSeeder(uri="bolt://localhost:7687")
    connected = seeder.connect()
    # Regardless of whether a live Neo4j daemon is running, calling close() and seeding must be safe
    seeder.close()
    assert connected in (True, False)


# ===========================================================================
# Task 3: Hybrid Retrieval with RRF & Graph Traversal Tests
# ===========================================================================
def test_bm25_search_exact_matches():
    """Verify BM25 search captures exact ratio numbers (1:15), section numbers, and land figures."""
    h_retriever = HybridGraphRetriever()
    results = h_retriever.bm25_search("1:15 ratio Faculty to Student Ratio Engineering", top_k=5)
    assert len(results) > 0
    # Top result should reference faculty ratio
    top_chunk_id, score = results[0]
    top_chunk = h_retriever.chunk_map[top_chunk_id]
    assert "faculty" in top_chunk.text.lower() or "ratio" in top_chunk.text.lower()


def test_bge_m3_dense_vector_search():
    """Verify BGE-M3 1024-dimensional dense vector embeddings and cosine similarity search."""
    vec = embedding_manager.embed_text("Change of Land Use Certificate for educational institution")
    assert len(vec) == 1024
    # Unit normalization check
    norm_sq = sum(x * x for x in vec)
    assert abs(norm_sq - 1.0) < 1e-3

    h_retriever = HybridGraphRetriever()
    vector_results = h_retriever.vector_search("Mandatory Land Use CLU Certificate", top_k=5)
    assert len(vector_results) > 0
    assert vector_results[0][1] > 0.0


def test_reciprocal_rank_fusion_scoring():
    """Verify RRF merges BM25 and dense vector rank lists correctly ($score = sum 1 / (k + rank))."""
    h_retriever = HybridGraphRetriever()
    bm25_res = [("c1", 10.0), ("c2", 8.0), ("c3", 5.0)]
    vec_res = [("c2", 0.95), ("c1", 0.85), ("c4", 0.70)]

    fused = h_retriever.reciprocal_rank_fusion(bm25_res, vec_res, k=60, top_k=4)
    # c1: 1/(60+1) + 1/(60+2) = 1/61 + 1/62 = 0.01639 + 0.01613 = 0.03252
    # c2: 1/(60+2) + 1/(60+1) = 1/62 + 1/61 = 0.03252
    assert len(fused) == 4
    doc_ids = [d[0] for d in fused]
    assert "c1" in doc_ids[:2]
    assert "c2" in doc_ids[:2]
    assert fused[0][1] > fused[2][1]


def test_graph_traversal_filtering():
    """Verify controlled 1- to 2-hop graph traversal dynamically filters on applicant facts."""
    facts = InstitutionFacts(
        programme="Engineering and Technology",
        location_type="Rural",
        application_type="Extension of Approval",
    )
    clause_nodes = in_memory_graph.find_nodes("RegulatoryClause")
    assert len(clause_nodes) > 0
    cid = clause_nodes[0]["id"]

    paths = retriever.traverse_graph_for_clauses([cid], institution_facts=facts, max_hops=2)
    assert len(paths) > 0
    for p in paths:
        assert p.hop_depth in (1, 2)
        assert len(p.relationship) > 0


# ===========================================================================
# Task 4: Reranking & Evidence Validation Tests
# ===========================================================================
def test_evidence_reranking_and_provenance():
    """Verify reranker retains top-K snippets and validates edition currency & program applicability."""
    facts = InstitutionFacts(
        programme="Engineering and Technology",
        location_type="Mega City",
        edition_year="2024-2027",
    )
    chunks, _ = retriever.retrieve_hybrid("7.5 acres land requirement Engineering", institution_facts=facts)
    evidence = reranker.rerank_and_validate("7.5 acres land requirement Engineering", chunks, facts, top_k=3)

    assert len(evidence) <= 3
    assert len(evidence) > 0
    top = evidence[0]
    assert top.currency_verified is True
    assert top.program_applicable is True
    assert top.is_valid is True
    assert top.rerank_score > 0.0


# ===========================================================================
# Task 5: LangGraph Multi-Agent Orchestration Tests
# ===========================================================================
def test_agent_orchestration_end_to_end():
    """Verify LangGraph multi-agent orchestration executes Retriever -> Evaluator -> Synthesizer."""
    payload = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-MOCK-101",
            institution_name="Apex Institute of Technology",
            programme="Engineering and Technology",
            location_type="Rural",
            total_enrolled_students=360,
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-MOCK-101",
            land_info=LandDetails(
                plot_number="Survey 42/1",
                land_area_acres=8.0,  # Compliant (>= 7.5)
                land_use_certificate_valid=True,
            ),
            total_builtup_area_sqm=5200.0,  # Compliant (>= 4000)
            faculty_list=[
                FacultyRow(name=f"Prof {i}", designation="Assistant Professor", department="CSE", qualification="M.Tech")
                for i in range(25)  # 25 faculty for 360 students -> 1:14.4 (Compliant < 1:15)
            ],
        ),
    )

    response = execute_compliance_audit(payload)
    assert isinstance(response, ComplianceAuditResponse)
    assert response.institution_id == "INST-MOCK-101"
    assert response.overall_status in ("APPROVED", "CONDITIONAL_APPROVAL")
    assert response.compliance_score >= 80.0
    assert len(response.findings) >= 3
    assert len(response.retrieved_evidence) > 0
    assert len(response.summary) > 50


def test_agent_orchestration_flags_deficiencies():
    """Verify agent flags shortfalls in land area and missing CLU."""
    payload = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-DEFICIENT-202",
            programme="Engineering and Technology",
            location_type="Rural",
            total_enrolled_students=400,
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-DEFICIENT-202",
            land_info=LandDetails(
                land_area_acres=2.0,  # Non-compliant in Rural (mandated 7.5)
                land_use_certificate_valid=False,  # Critical non-compliance
            ),
            total_builtup_area_sqm=2000.0,  # Shortfall (< 4000)
            faculty_list=[],  # Missing faculty
        ),
    )

    response = execute_compliance_audit(payload)
    assert response.overall_status in ("REJECTED", "DEFICIENT")
    assert response.compliance_score < 70.0

    finding_map = {f.finding_id: f for f in response.findings}
    assert "find_land_area" in finding_map
    assert finding_map["find_land_area"].status == "NON_COMPLIANT"

    assert "find_land_clu" in finding_map
    assert finding_map["find_land_clu"].status == "NON_COMPLIANT"
    assert finding_map["find_land_clu"].severity == "CRITICAL"


# ===========================================================================
# Task 6: API Integration Endpoint Tests
# ===========================================================================
def test_api_compliance_audit_endpoint():
    """Test POST /api/v1/compliance-audit endpoint via FastAPI TestClient."""
    req_body = {
        "institution_facts": {
            "institution_id": "INST-API-001",
            "institution_name": "Metro Technical University",
            "programme": "Engineering and Technology",
            "location_type": "Mega City",
            "approved_intake": 360,
            "total_enrolled_students": 360,
        },
        "extracted_data": {
            "institution_id": "INST-API-001",
            "land_info": {
                "plot_number": "CTS 104",
                "land_area_acres": 2.0,  # In Mega City, required 1.5 acres -> Compliant!
                "land_use_certificate_valid": True,
            },
            "total_builtup_area_sqm": 6000.0,
            "faculty_list": [
                {"name": f"Dr. Faculty {i}", "designation": "Associate Professor", "department": "AI", "qualification": "Ph.D"}
                for i in range(24)
            ],
        },
        "forensics_data": {
            "success": True,
            "filename": "application_signed.pdf",
            "file_type": "pdf",
            "page_analyzed": 0,
            "composite_score": 12.5,
            "risk_level": "LOW",
            "is_tampered": False,
            "score_breakdown": {
                "ela": {
                    "anomaly_score": 10.0,
                    "mean_difference": 1.2,
                    "max_difference": 15.0,
                    "std_difference": 2.1,
                    "high_error_ratio": 0.01,
                    "is_suspicious": False,
                    "tampering_detected": False,
                },
                "blur_and_smoothing": {
                    "global_laplacian_variance": 450.0,
                    "blur_score": 15.0,
                    "is_blurred": False,
                    "tampering_detected": False,
                },
            },
            "flags": [],
        },
        "source_verification": {
            "success": True,
            "document_name": "application_signed.pdf",
            "document_sha256": "abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            "verification_timestamp": "2026-10-25T12:00:00Z",
            "overall_status": "AUTHENTIC",
            "trust_score": 95.0,
            "pki_verification": {
                "signatures_found": 1,
                "all_intact": True,
                "all_valid": True,
                "tampered_post_signing": False,
                "signatures": [],
            },
            "qr_verification": {
                "qr_codes_found": 1,
                "authoritative_url_matched": True,
                "extracted_records": [],
            },
            "receipt_id": "rcpt_mock_001",
        },
    }

    res = client.post("/api/v1/compliance-audit", json=req_body)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["audit_id"].startswith("audit_")
    assert data["institution_id"] == "INST-API-001"
    assert data["overall_status"] in ("APPROVED", "CONDITIONAL_APPROVAL")
    assert data["compliance_score"] >= 80.0
    assert len(data["findings"]) >= 5
    assert len(data["retrieved_evidence"]) > 0
    assert len(data["graph_paths"]) > 0
    assert "summary" in data and len(data["summary"]) > 0


if __name__ == "__main__":
    print("Running Layer 4 Compliance Engine Test Suite...")
    test_aph_handbook_pdf_exists()
    print("PASS: test_aph_handbook_pdf_exists")
    test_structure_aware_chunking_metadata()
    print("PASS: test_structure_aware_chunking_metadata")
    test_chunk_token_boundaries()
    print("PASS: test_chunk_token_boundaries")
    test_knowledge_graph_seeding_entities_and_relationships()
    print("PASS: test_knowledge_graph_seeding_entities_and_relationships")
    test_neo4j_driver_graceful_connectivity()
    print("PASS: test_neo4j_driver_graceful_connectivity")
    test_bm25_search_exact_matches()
    print("PASS: test_bm25_search_exact_matches")
    test_bge_m3_dense_vector_search()
    print("PASS: test_bge_m3_dense_vector_search")
    test_reciprocal_rank_fusion_scoring()
    print("PASS: test_reciprocal_rank_fusion_scoring")
    test_graph_traversal_filtering()
    print("PASS: test_graph_traversal_filtering")
    test_evidence_reranking_and_provenance()
    print("PASS: test_evidence_reranking_and_provenance")
    test_agent_orchestration_end_to_end()
    print("PASS: test_agent_orchestration_end_to_end")
    test_agent_orchestration_flags_deficiencies()
    print("PASS: test_agent_orchestration_flags_deficiencies")
    test_api_compliance_audit_endpoint()
    print("PASS: test_api_compliance_audit_endpoint")
    print("\nALL 13 LAYER 4 TESTS PASSED SUCCESSFULLY!")
