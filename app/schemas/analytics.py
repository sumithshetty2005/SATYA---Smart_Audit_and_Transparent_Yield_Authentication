"""Pydantic v2 schemas for Layer 5: Analytics, Audit Reporting & Dashboard Integration.

Defines models for synthesized audit clearance reports, PDF/JSON export requests,
Institutional Health Index (IHI), cross-institutional anomaly detection, and dashboard summaries.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.compliance import (
    ComplianceAuditResponse,
    InstitutionFacts,
    RegulatoryFinding,
)
from app.schemas.payload import (
    ExtractedApplicationPayload,
    ForensicsResponse,
    SourceVerificationReceipt,
)


class LayerFiveReportRequest(BaseModel):
    """Input payload for generating a comprehensive Layer 5 audit clearance report."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    compliance_audit: Optional[ComplianceAuditResponse] = Field(
        default=None,
        description="Layer 4: Regulatory audit output containing findings, score, and citations",
    )
    institution_facts: Optional[InstitutionFacts] = Field(
        default=None,
        description="Layer 1 / Institutional facts (ID, name, programme, location, intake)",
    )
    forensics_data: Optional[ForensicsResponse] = Field(
        default=None,
        description="Layer 2: Visual tampering and ELA analysis results",
    )
    source_verification: Optional[SourceVerificationReceipt] = Field(
        default=None,
        description="Layer 3: Cryptographic PKI and QR verification receipt",
    )
    extracted_data: Optional[ExtractedApplicationPayload] = Field(
        default=None,
        description="Layer 1: Extracted application fields, land specifications, and faculty rosters",
    )
    custom_notes: Optional[str] = Field(
        default=None,
        description="Optional auditor notes or regulatory remarks to append to report",
    )


class LayerFiveAuditReport(BaseModel):
    """Synthesized comprehensive AICTE compliance audit clearance report (JSON)."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    report_id: str = Field(..., description="Unique certificate / report tracking identifier")
    receipt_id: str = Field(default="", description="Cryptographic receipt identifier from Layer 3")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of report generation")
    institution_details: Dict[str, Any] = Field(
        default_factory=dict,
        description="Institutional metadata (ID, legal name, programme, location, edition year)",
    )
    overall_trust_score: float = Field(
        ...,
        description="Synthesized multi-layer trust score from 0.0 to 100.0",
    )
    final_verdict: str = Field(
        ...,
        description="Final regulatory audit clearance verdict: 'VERIFIED' or 'NON_COMPLIANT'",
    )
    institutional_health_index: float = Field(
        default=80.0,
        description="Institutional Health Index (IHI) score from 0.0 to 100.0",
    )
    layer1_extraction_summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Layer 1 summary: Land area, built-up area, and faculty counts",
    )
    layer2_forensics_breakdown: Dict[str, Any] = Field(
        default_factory=dict,
        description="Layer 2 summary: Composite tampering score, risk level, ELA status, and blur",
    )
    layer3_source_verification_breakdown: Dict[str, Any] = Field(
        default_factory=dict,
        description="Layer 3 summary: PKI digital signatures, QR payload validity, and SHA-256 hash",
    )
    layer4_regulatory_citations: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Layer 4 breakdown: Itemized findings with exact handbook clause citations",
    )
    anomalies_detected: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Any local or cross-institutional anomalies flagged for this submission",
    )
    executive_summary: str = Field(
        default="",
        description="Official executive narrative summarizing multi-layer verification results",
    )
    pdf_download_url: Optional[str] = Field(
        default=None,
        description="Relative endpoint URL to download the official PDF certificate",
    )


class InstitutionalSubmissionRecord(BaseModel):
    """Historical or departmental submission record for aggregate analytics."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    submission_id: str = Field(..., description="Unique submission UUID")
    institution_id: str = Field(..., description="Permanent Institute ID")
    institution_name: str = Field(..., description="Legal institution name")
    department_or_programme: str = Field(default="Engineering and Technology", description="Academic department")
    academic_year: str = Field(default="2024-2025", description="Academic year of submission")
    trust_score: float = Field(default=85.0, description="Overall trust score achieved")
    compliance_score: float = Field(default=80.0, description="Layer 4 regulatory compliance score")
    tampering_score: float = Field(default=10.0, description="Layer 2 visual tampering score")
    pki_verified: bool = Field(default=True, description="Whether PKI signature was verified")
    faculty_count: int = Field(default=60, description="Total full-time faculty declared")
    classrooms_count: int = Field(default=16, description="Total classrooms provided")
    land_area_acres: float = Field(default=7.5, description="Total land area in acres")
    survey_numbers: List[str] = Field(
        default_factory=list,
        description="List of land survey / khasra numbers declared in application",
    )
    faculty_roster: List[Dict[str, str]] = Field(
        default_factory=list,
        description="List of faculty members: [{'name': '...', 'uid': '...', 'designation': '...'}]",
    )
    verdict: str = Field(default="VERIFIED", description="Final verdict: 'VERIFIED' or 'NON_COMPLIANT'")
    timestamp: str = Field(default="2026-10-26T10:00:00Z", description="Submission timestamp")


class InstitutionalHealthIndexResult(BaseModel):
    """Institutional Health Index (IHI) aggregate metric evaluation."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    institution_id: str = Field(..., description="Permanent Institute ID")
    institution_name: str = Field(..., description="Name of the institution")
    health_index: float = Field(..., description="Overall health index score from 0.0 to 100.0")
    grade: str = Field(..., description="Performance grade: 'A+ (Exemplary)', 'A (Compliant)', 'B (Deficient)', 'C (Critical)'")
    component_scores: Dict[str, float] = Field(
        ...,
        description="Component percentage scores: Regulatory Compliance, Forensic Integrity, Cryptographic Provenance, Cadre Stability",
    )
    total_submissions_analyzed: int = Field(default=1, description="Number of submissions evaluated")
    risk_assessment: str = Field(default="LOW_RISK", description="Overall risk status: 'LOW_RISK', 'MODERATE_RISK', 'HIGH_RISK'")
    recommendations: List[str] = Field(default_factory=list, description="Prescribed continuous improvement steps")


class CrossInstitutionalAnomaly(BaseModel):
    """Anomaly detected by scanning across multiple distinct institutional applications."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    anomaly_id: str = Field(..., description="Unique anomaly identifier")
    anomaly_type: str = Field(
        ...,
        description="Anomaly type: 'DUPLICATE_LAND_PARCEL' or 'GHOST_FACULTY_OVERLAP'",
    )
    severity: str = Field(default="HIGH", description="Severity level: 'CRITICAL', 'HIGH', 'MEDIUM'")
    entity_identifier: str = Field(
        ...,
        description="Conflicting identifier (e.g. Survey No. '104/A' or Faculty ID 'FAC-8821')",
    )
    conflicting_institutions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of institutions where the conflicting resource was claimed simultaneously",
    )
    description: str = Field(..., description="Detailed description of the conflict")
    recommended_action: str = Field(..., description="Recommended council audit action or investigation")


class DashboardSummaryResponse(BaseModel):
    """Aggregated compliance statistics and anomaly overview for frontend dashboard."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    total_audits_conducted: int = Field(default=0, description="Total audits processed to date")
    overall_approval_rate: float = Field(default=0.0, description="Percentage of applications marked VERIFIED")
    average_compliance_score: float = Field(default=0.0, description="Average Layer 4 compliance score")
    average_trust_score: float = Field(default=0.0, description="Average Layer 1-4 multi-layer trust score")
    verdict_breakdown: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of audits grouped by verdict ('VERIFIED', 'NON_COMPLIANT')",
    )
    risk_level_breakdown: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of audits grouped by forensic risk level ('LOW', 'MEDIUM', 'HIGH')",
    )
    active_anomalies_count: int = Field(default=0, description="Count of detected cross-institutional anomalies")
    active_anomalies: List[CrossInstitutionalAnomaly] = Field(
        default_factory=list,
        description="List of current cross-institutional land/faculty collisions",
    )
    recent_health_indices: List[InstitutionalHealthIndexResult] = Field(
        default_factory=list,
        description="Institutional Health Indices for top monitored institutions",
    )
    recent_audits: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Recent audit summaries for dashboard table feed",
    )
