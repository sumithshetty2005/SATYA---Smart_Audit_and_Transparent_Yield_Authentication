"""Unit and Integration Tests for Layer 5: Analytics, Audit Reporting & Dashboard Integration.

Verifies:
1. LayerFiveAnalyticsEngine: JSON and official-style PDF clearance report generation.
2. Multi-layer trust score calculation and final verdict determination (VERIFIED vs NON_COMPLIANT).
3. Institutional Health Index (IHI) aggregate metric calculation.
4. Cross-institutional anomaly detection:
   - Duplicate land survey number collisions.
   - Overlapping full-time faculty appointments ("Ghost Faculty").
5. Dashboard summary metrics aggregation.
6. FastAPI endpoints:
   - POST /api/v1/reports/generate
   - POST /api/v1/reports/generate-pdf
   - GET /api/v1/analytics/dashboard-summary
   - GET /api/v1/analytics/anomalies
   - GET /api/v1/analytics/health-index
   - POST /api/v1/analytics/submissions
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

from backend.main import app
from app.analytics.dashboard_services import (
    DashboardAnalyticsService,
    calculate_institutional_health_index,
    dashboard_service,
    detect_cross_institutional_anomalies,
)
from app.analytics.report_generator import LayerFiveAnalyticsEngine, report_engine
from app.schemas.analytics import (
    InstitutionalSubmissionRecord,
    LayerFiveAuditReport,
    LayerFiveReportRequest,
)
from app.schemas.compliance import (
    ComplianceAuditResponse,
    InstitutionFacts,
    RegulatoryFinding,
)
from app.schemas.payload import (
    BlurDetectionResult,
    ELAResult,
    ExtractedApplicationPayload,
    ForensicsBreakdown,
    ForensicsResponse,
    LandDetails,
    PKISignatureRecord,
    PKIVerificationResult,
    QRVerificationResult,
    SourceVerificationReceipt,
)


@pytest.fixture
def sample_report_request() -> LayerFiveReportRequest:
    """Fixture providing a realistic Layer 1-4 consolidated payload."""
    inst_facts = InstitutionFacts(
        institution_id="1-4567890123",
        institution_name="Dr. Babasaheb Ambedkar College of Engineering",
        programme="Engineering and Technology",
        level="Undergraduate",
        application_type="Extension of Approval",
        location_type="Rural",
        state="Maharashtra",
        edition_year="2024-2027",
        approved_intake=360,
        total_enrolled_students=360,
    )

    # Layer 1
    ext_data = ExtractedApplicationPayload(
        institution_id="1-4567890123",
        land_info=LandDetails(
            plot_number="Survey No. 88/1",
            land_area_acres=7.5,
            land_use_certificate_valid=True,
        ),
        total_builtup_area_sqm=5200.0,
        faculty_list=[],
    )

    # Layer 2
    forensics = ForensicsResponse(
        success=True,
        filename="application_affidavit.pdf",
        file_type="pdf",
        composite_score=11.2,
        risk_level="LOW",
        is_tampered=False,
        score_breakdown=ForensicsBreakdown(
            ela=ELAResult(
                anomaly_score=10.2,
                mean_difference=8.5,
                max_difference=24.0,
                std_difference=4.1,
                high_error_ratio=0.015,
                is_suspicious=False,
                tampering_detected=False,
            ),
            blur_and_smoothing=BlurDetectionResult(
                global_laplacian_variance=280.0,
                blur_score=8.0,
                is_blurred=False,
                tampering_detected=False,
            ),
        ),
        flags=["Surface integrity intact"],
    )

    # Layer 3
    source_ver = SourceVerificationReceipt(
        success=True,
        document_name="application_affidavit.pdf",
        document_sha256="4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
        verification_timestamp="2026-10-26T10:00:00Z",
        overall_status="AUTHENTIC",
        trust_score=94.0,
        pki_verification=PKIVerificationResult(
            signatures_found=1,
            all_intact=True,
            all_valid=True,
            tampered_post_signing=False,
            signatures=[
                PKISignatureRecord(
                    field_name="Sig1",
                    valid=True,
                    intact=True,
                    status_summary="Valid digital signature",
                )
            ],
        ),
        qr_verification=QRVerificationResult(
            qr_codes_found=1,
            authoritative_url_matched=True,
            extracted_records=[],
        ),
        receipt_id="RCPT-98214-AUTHENTIC",
    )

    # Layer 4
    compliance = ComplianceAuditResponse(
        audit_id="AUD-998877",
        timestamp="2026-10-26T10:05:00Z",
        institution_id="1-4567890123",
        programme="Engineering and Technology",
        overall_status="APPROVED",
        compliance_score=88.0,
        summary="Application meets all prescribed AICTE statutory norms under APH (2024-2027).",
        findings=[
            RegulatoryFinding(
                finding_id="FIND-01",
                category="Infrastructure",
                clause_reference="Annexure 3.2.1 (A)",
                section_id="Chapter 4",
                title="Instructional Classrooms Requirement",
                status="COMPLIANT",
                required_standard="Divisions * Duration * 0.5 dedicated classrooms (Req: 16)",
                actual_value="16 classrooms provided",
                gap_analysis="Meets requirement exactly.",
            ),
            RegulatoryFinding(
                finding_id="FIND-02",
                category="Faculty",
                clause_reference="Annexure 5.2",
                section_id="Chapter 3",
                title="Faculty Student Ratio and Cadre",
                status="COMPLIANT",
                required_standard="SFR 1:20 and Cadre 1:2:6",
                actual_value="60 Faculty (7 Prof, 13 Assoc, 40 Asst)",
                gap_analysis="Faculty strength satisfies standard.",
            ),
        ],
    )

    return LayerFiveReportRequest(
        compliance_audit=compliance,
        institution_facts=inst_facts,
        forensics_data=forensics,
        source_verification=source_ver,
        extracted_data=ext_data,
        custom_notes="Scrutiny inspection completed successfully.",
    )


# ===========================================================================
# 1. Report Generation Engine Tests
# ===========================================================================


def test_json_audit_report_generation(sample_report_request: LayerFiveReportRequest):
    """Verify LayerFiveAnalyticsEngine synthesizes multi-layer outputs into valid JSON report."""
    engine = LayerFiveAnalyticsEngine()
    report = engine.generate_json_audit_report(sample_report_request)

    assert isinstance(report, LayerFiveAuditReport)
    assert report.report_id.startswith("REP-AICTE-")
    assert report.receipt_id == "RCPT-98214-AUTHENTIC"
    assert report.final_verdict == "VERIFIED"
    assert 80.0 <= report.overall_trust_score <= 100.0
    assert report.institutional_health_index >= 70.0

    # Verify breakdown sections
    assert report.institution_details["institution_id"] == "1-4567890123"
    assert report.layer2_forensics_breakdown["risk_level"] == "LOW"
    assert report.layer2_forensics_breakdown["is_tampered"] is False
    assert report.layer3_source_verification_breakdown["pki_signatures_valid"] is True
    assert len(report.layer4_regulatory_citations) == 2
    assert "Annexure 3.2.1 (A)" in report.layer4_regulatory_citations[0]["clause_cited"]
    assert "Scrutiny inspection completed" in report.executive_summary


def test_non_compliant_verdict_when_tampered(sample_report_request: LayerFiveReportRequest):
    """Verify that document tampering flags force a final NON_COMPLIANT verdict."""
    engine = LayerFiveAnalyticsEngine()

    # Modify Layer 2 to simulate high-confidence tampering
    sample_report_request.forensics_data.is_tampered = True
    sample_report_request.forensics_data.composite_score = 65.0
    sample_report_request.forensics_data.risk_level = "HIGH"

    report = engine.generate_json_audit_report(sample_report_request)
    assert report.final_verdict == "NON_COMPLIANT"
    assert report.layer2_forensics_breakdown["risk_level"] == "HIGH"


def test_pdf_report_generation(sample_report_request: LayerFiveReportRequest, tmp_path: Path):
    """Verify official PDF certificate generation creates valid, renderable PDF bytes."""
    engine = LayerFiveAnalyticsEngine()
    pdf_path = tmp_path / "test_aicte_certificate.pdf"

    pdf_bytes = engine.generate_pdf_audit_report(sample_report_request, output_path=str(pdf_path))

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")  # Valid PDF binary signature
    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 1000


# ===========================================================================
# 2. Institutional Health Index & Analytics Tests
# ===========================================================================


def test_calculate_institutional_health_index():
    """Verify weighted Institutional Health Index (IHI) aggregation and letter grading."""
    submissions = [
        InstitutionalSubmissionRecord(
            submission_id="SUB-01",
            institution_id="INST-101",
            institution_name="Institute of Technology",
            compliance_score=85.0,
            tampering_score=10.0,
            pki_verified=True,
            faculty_count=60,
            classrooms_count=16,
            land_area_acres=7.5,
        ),
        InstitutionalSubmissionRecord(
            submission_id="SUB-02",
            institution_id="INST-101",
            institution_name="Institute of Technology",
            compliance_score=90.0,
            tampering_score=8.0,
            pki_verified=True,
            faculty_count=62,
            classrooms_count=18,
            land_area_acres=7.5,
        ),
    ]

    result = calculate_institutional_health_index(submissions)

    assert result.institution_id == "INST-101"
    assert result.health_index >= 85.0
    assert "A+" in result.grade or "A" in result.grade
    assert result.risk_assessment == "LOW_RISK"
    assert "regulatory_compliance" in result.component_scores
    assert "forensic_authenticity" in result.component_scores
    assert result.total_submissions_analyzed == 2


def test_calculate_ihi_for_deficient_institution():
    """Verify low compliance and tampering degrade Institutional Health Index to B or C."""
    submissions = [
        InstitutionalSubmissionRecord(
            submission_id="SUB-BAD-01",
            institution_id="INST-999",
            institution_name="Struggling College",
            compliance_score=40.0,
            tampering_score=55.0,
            pki_verified=False,
            faculty_count=20,
            classrooms_count=8,
            land_area_acres=2.0,
        )
    ]

    result = calculate_institutional_health_index(submissions)
    assert result.health_index < 60.0
    assert result.grade.startswith("B") or result.grade.startswith("C")
    assert result.risk_assessment in ("MODERATE_RISK", "HIGH_RISK")


# ===========================================================================
# 3. Cross-Institutional Anomaly Detection Tests
# ===========================================================================


def test_cross_institutional_duplicate_land_anomaly():
    """Verify that claiming identical land survey numbers across different colleges is flagged."""
    submissions = [
        InstitutionalSubmissionRecord(
            submission_id="SUB-A",
            institution_id="COLLEGE-ALPHA",
            institution_name="Alpha Engineering College",
            survey_numbers=["Survey No. 104/A", "Plot 22"],
            faculty_roster=[],
        ),
        InstitutionalSubmissionRecord(
            submission_id="SUB-B",
            institution_id="COLLEGE-BETA",
            institution_name="Beta Technical Institute",
            survey_numbers=["Survey-104/A", "Plot 99"],  # Duplicate 104/A!
            faculty_roster=[],
        ),
    ]

    anomalies = detect_cross_institutional_anomalies(submissions)
    land_anomalies = [a for a in anomalies if a.anomaly_type == "DUPLICATE_LAND_PARCEL"]

    assert len(land_anomalies) >= 1
    anom = land_anomalies[0]
    assert anom.severity == "CRITICAL"
    assert "104/A" in anom.entity_identifier or "104" in anom.entity_identifier
    assert len(anom.conflicting_institutions) == 2
    inst_ids = [c["institution_id"] for c in anom.conflicting_institutions]
    assert "COLLEGE-ALPHA" in inst_ids
    assert "COLLEGE-BETA" in inst_ids


def test_cross_institutional_ghost_faculty_anomaly():
    """Verify that concurrent regular faculty registration across colleges is flagged."""
    submissions = [
        InstitutionalSubmissionRecord(
            submission_id="SUB-1",
            institution_id="COLLEGE-X",
            institution_name="College X",
            survey_numbers=["Plot 1"],
            faculty_roster=[
                {
                    "name": "Dr. Ananya Roy",
                    "uid": "PAN-ABCDE1234F",
                    "qualification": "Ph.D",
                    "designation": "Professor",
                }
            ],
        ),
        InstitutionalSubmissionRecord(
            submission_id="SUB-2",
            institution_id="COLLEGE-Y",
            institution_name="College Y",
            survey_numbers=["Plot 2"],
            faculty_roster=[
                {
                    "name": "Dr. Ananya Roy",
                    "uid": "PAN-ABCDE1234F",  # Exact duplicate UID/PAN!
                    "qualification": "Ph.D",
                    "designation": "Professor",
                }
            ],
        ),
    ]

    anomalies = detect_cross_institutional_anomalies(submissions)
    fac_anomalies = [a for a in anomalies if a.anomaly_type == "GHOST_FACULTY_OVERLAP"]

    assert len(fac_anomalies) >= 1
    anom = fac_anomalies[0]
    assert anom.severity == "HIGH"
    assert "Ananya" in anom.entity_identifier or "PAN-ABCDE1234F" in anom.entity_identifier
    assert len(anom.conflicting_institutions) == 2


# ===========================================================================
# 4. FastAPI Router & API Integration Tests
# ===========================================================================


@pytest.fixture
def client() -> TestClient:
    """Fixture providing FastAPI TestClient."""
    return TestClient(app)


def test_api_generate_report_endpoint(client: TestClient, sample_report_request: LayerFiveReportRequest):
    """Test POST /api/v1/reports/generate endpoint."""
    payload = sample_report_request.model_dump()
    response = client.post("/api/v1/reports/generate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "report_id" in data
    assert data["final_verdict"] == "VERIFIED"
    assert "overall_trust_score" in data
    assert "layer2_forensics_breakdown" in data
    assert "layer3_source_verification_breakdown" in data
    assert "layer4_regulatory_citations" in data


def test_api_generate_pdf_endpoint(client: TestClient, sample_report_request: LayerFiveReportRequest):
    """Test POST /api/v1/reports/generate-pdf streams valid application/pdf binary."""
    payload = sample_report_request.model_dump()
    response = client.post("/api/v1/reports/generate-pdf", json=payload)

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
    assert response.content.startswith(b"%PDF-")


def test_api_dashboard_summary_endpoint(client: TestClient):
    """Test GET /api/v1/analytics/dashboard-summary serves real-time dashboard data."""
    response = client.get("/api/v1/analytics/dashboard-summary")

    assert response.status_code == 200
    data = response.json()
    assert data["total_audits_conducted"] >= 1
    assert "overall_approval_rate" in data
    assert "average_compliance_score" in data
    assert "average_trust_score" in data
    assert "verdict_breakdown" in data
    assert "risk_level_breakdown" in data
    assert "active_anomalies" in data
    assert "recent_audits" in data


def test_api_anomalies_endpoint(client: TestClient):
    """Test GET /api/v1/analytics/anomalies returns cross-institutional collisions."""
    response = client.get("/api/v1/analytics/anomalies")

    assert response.status_code == 200
    anomalies = response.json()
    assert isinstance(anomalies, list)
    assert len(anomalies) >= 1  # Pre-seeded benchmark data contains collisions


def test_api_health_indices_endpoint(client: TestClient):
    """Test GET /api/v1/analytics/health-index returns IHI metrics."""
    response = client.get("/api/v1/analytics/health-index")

    assert response.status_code == 200
    indices = response.json()
    assert isinstance(indices, list)
    assert len(indices) >= 1
    assert "health_index" in indices[0]
    assert "grade" in indices[0]
