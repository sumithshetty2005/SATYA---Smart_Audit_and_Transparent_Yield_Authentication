"""Pydantic v2 schemas for Layer 4: Agentic GraphRAG & Regulatory Engine.

Defines payloads, findings, evidence provenance models, and audit response structures.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.payload import (
    ExtractedApplicationPayload,
    ForensicsResponse,
    SourceVerificationReceipt,
)


class InstitutionFacts(BaseModel):
    """Institutional parameters and facts used to steer GraphRAG retrieval and validation."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    institution_id: str = Field(
        default="",
        description="AICTE Permanent Institute ID or application identifier",
    )
    institution_name: str = Field(
        default="",
        description="Legal name of the institution or applicant trust",
    )
    programme: str = Field(
        default="Engineering and Technology",
        description="Academic discipline/stream (e.g. 'Engineering and Technology', 'Management', 'Pharmacy', 'MCA', 'Architecture')",
    )
    level: str = Field(
        default="Undergraduate",
        description="Program level (e.g. 'Undergraduate', 'Postgraduate', 'Diploma')",
    )
    application_type: str = Field(
        default="Extension of Approval",
        description="Application category (e.g. 'Setting Up New Institution', 'Extension of Approval', 'Increase in Intake')",
    )
    location_type: str = Field(
        default="Rural",
        description="Zoning/geographical category ('Rural', 'Urban', 'Mega City', 'Metro', 'Hilly Area')",
    )
    state: str = Field(
        default="Maharashtra",
        description="State or Union Territory of the institution",
    )
    edition_year: str = Field(
        default="2024-2027",
        description="Target AICTE Approval Process Handbook cycle edition",
    )
    approved_intake: int = Field(
        default=360,
        description="Total sanctioned student intake across all running batches",
    )
    total_enrolled_students: int = Field(
        default=360,
        description="Total student body currently enrolled",
    )
    course_codes: List[str] = Field(
        default_factory=lambda: ["101", "102"],
        description="List of AICTE/department approved course codes",
    )
    delivery_mode: str = Field(
        default="Regular",
        description="Mode of education: 'Regular', 'Open and Distance Learning (ODL)', or 'Online Learning (OL)'",
    )
    is_hilly_area: bool = Field(
        default=False,
        description="Whether institution is located in a designated hilly/mountainous terrain",
    )
    institution_category: str = Field(
        default="Private",
        description="Institution category: 'Private', 'Government', 'Minority', 'Government-Aided'",
    )
    plot_details: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="List of land parcels including plot names, distances, and functional usages",
    )
    courses_count: Optional[int] = Field(
        default=None,
        description="Number of distinct approved academic courses/programs",
    )
    divisions_per_course: Optional[int] = Field(
        default=None,
        description="Number of student divisions running per course",
    )
    course_duration_years: Optional[int] = Field(
        default=None,
        description="Standard duration of the program in years",
    )
    classrooms_provided: Optional[int] = Field(
        default=None,
        description="Total number of dedicated instructional classrooms provided",
    )
    ter_fee_paid_lakhs: Optional[float] = Field(
        default=None,
        description="Technical Education Regulatory (TER) charges remitted in Lakhs (INR)",
    )
    operational_funds_lakhs: Optional[float] = Field(
        default=None,
        description="Operational expense funds / FDR proof shown at scrutiny in Lakhs (INR)",
    )
    adjunct_and_pop_percentage: Optional[float] = Field(
        default=None,
        description="Percentage of total required faculty appointed as Adjunct Faculty or Professors of Practice",
    )
    professors_count: Optional[int] = Field(
        default=None,
        description="Number of appointed full-time Professors",
    )
    associate_professors_count: Optional[int] = Field(
        default=None,
        description="Number of appointed full-time Associate Professors",
    )
    assistant_professors_count: Optional[int] = Field(
        default=None,
        description="Number of appointed full-time Assistant Professors",
    )
    odl_academic_staff: Optional[Dict[str, int]] = Field(
        default=None,
        description="Academic staff breakdown at headquarters for ODL/OL programs",
    )


class EvidenceSnippet(BaseModel):
    """Retrieved and reranked passage with provenance validation metrics."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    chunk_id: str = Field(..., description="Unique chunk identifier")
    title: str = Field(..., description="Section or clause title")
    edition_year: str = Field(default="2024-2027", description="Handbook edition year")
    section_id: str = Field(..., description="Section identifier (e.g. 'Section 2.1')")
    clause_reference: str = Field(..., description="Exact clause reference (e.g. 'Clause 2.1.2')")
    page_number: int = Field(default=1, description="Source page number in handbook")
    table_context: Optional[str] = Field(default=None, description="Contextual table name if applicable")
    text: str = Field(..., description="Textual excerpt of the regulatory rule")
    rrf_score: float = Field(default=0.0, description="Reciprocal Rank Fusion score")
    rerank_score: float = Field(default=0.0, description="Cross-encoder or post-reranker confidence score")
    currency_verified: bool = Field(
        default=True,
        description="Whether snippet belongs to active 2024-2027 APH regulatory cycle",
    )
    program_applicable: bool = Field(
        default=True,
        description="Whether rule governs the applicant institution's academic programme",
    )
    is_valid: bool = Field(
        default=True,
        description="Overall provenance validation pass flag",
    )
    validation_notes: str = Field(
        default="",
        description="Validation audit notes or active exception qualifiers",
    )


class GraphTraversalPath(BaseModel):
    """Structured step or node discovered during Neo4j 1- to 2-hop traversal."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    from_node: str = Field(..., description="Origin node identifier or label")
    from_label: str = Field(..., description="Origin node Cypher label")
    relationship: str = Field(..., description="Directed relationship type (e.g. MANDATES, HAS_EXCEPTION)")
    to_node: str = Field(..., description="Target node identifier or label")
    to_label: str = Field(..., description="Target node Cypher label")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Relationship or target node properties")
    hop_depth: int = Field(default=1, description="Graph traversal hop distance (1 or 2)")
    matched_fact: Optional[str] = Field(default=None, description="Applicant fact matched during traversal")


class RegulatoryFinding(BaseModel):
    """Evaluation finding assessing applicant parameters against APH clauses."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    finding_id: str = Field(..., description="Unique finding ID")
    clause_reference: str = Field(..., description="AICTE clause reference (e.g. 'Clause 2.1.1')")
    section_id: str = Field(..., description="Handbook section ID (e.g. 'Section 2.1')")
    title: str = Field(..., description="Descriptive requirement title")
    category: str = Field(
        ...,
        description="Category: 'Land & Infrastructure', 'Faculty Cadre & Ratio', 'Statutory Approvals', 'Document Authenticity & Forensics', etc.",
    )
    status: str = Field(
        ...,
        description="Compliance verdict: 'COMPLIANT', 'NON_COMPLIANT', 'CONDITIONAL', 'DEFICIENT', 'NOT_APPLICABLE'",
    )
    severity: str = Field(
        default="MEDIUM",
        description="Risk level: 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'",
    )
    required_standard: str = Field(..., description="Mandated standard per APH handbook")
    actual_value: str = Field(..., description="Observed applicant value from Layers 1-3")
    gap_analysis: str = Field(..., description="Detailed explanation of compliance or shortfall")
    exception_applied: Optional[str] = Field(default=None, description="Details of any granted concession or exception")
    corrective_action: str = Field(default="", description="Prescribed remediation steps if non-compliant")


class ComplianceAuditRequest(BaseModel):
    """Consolidated input payload combining Layers 1–3 outputs and institutional facts."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    institution_facts: Optional[InstitutionFacts] = Field(
        default_factory=InstitutionFacts,
        description="Declared institutional facts and application scope",
    )
    extracted_data: Optional[ExtractedApplicationPayload] = Field(
        default=None,
        description="Layer 1: Extracted application fields, land specifications, and faculty rosters",
    )
    forensics_data: Optional[ForensicsResponse] = Field(
        default=None,
        description="Layer 2: Visual tampering, ELA scores, and document tampering breakdown",
    )
    source_verification: Optional[SourceVerificationReceipt] = Field(
        default=None,
        description="Layer 3: Cryptographic PKI digital signatures and authoritative 2D QR receipts",
    )
    query_override: Optional[str] = Field(
        default=None,
        description="Optional custom query string to steer GraphRAG retrieval",
    )


class ComplianceAuditResponse(BaseModel):
    """Final regulatory verification audit report generated by Layer 4 Agentic GraphRAG Engine."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    audit_id: str = Field(..., description="Unique compliance audit UUID")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of audit generation")
    institution_id: str = Field(default="", description="Permanent Institute ID audited")
    programme: str = Field(default="", description="Academic programme audited")
    overall_status: str = Field(
        ...,
        description="Final regulatory decision: 'APPROVED', 'REJECTED', 'DEFICIENT', 'CONDITIONAL_APPROVAL'",
    )
    compliance_score: float = Field(
        ...,
        description="Overall regulatory compliance score from 0.0 to 100.0",
    )
    summary: str = Field(..., description="Executive summary of the regulatory audit findings")
    findings: List[RegulatoryFinding] = Field(
        default_factory=list,
        description="Itemized compliance findings citing exact APH clauses",
    )
    retrieved_evidence: List[EvidenceSnippet] = Field(
        default_factory=list,
        description="Top-K validated evidence passages retrieved from APH handbook",
    )
    graph_paths: List[GraphTraversalPath] = Field(
        default_factory=list,
        description="Graph traversal paths traversed in Neo4j Knowledge Graph",
    )
    llm_provider: str = Field(
        default="groq",
        description="LLM provider utilized: 'groq', 'gemini', or 'rule_based_fallback'",
    )
    model_used: str = Field(
        default="gpt-oss-120b",
        description="Specific model identifier utilized for evaluation and synthesis",
    )
    execution_time_seconds: float = Field(
        default=0.0,
        description="Total pipeline execution latency in seconds",
    )
