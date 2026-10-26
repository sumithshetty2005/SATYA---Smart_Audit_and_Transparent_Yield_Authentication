"""Layer 5: Analytics, Institutional Health Index & Cross-Institutional Anomaly Detection.

Implements:
1. calculate_institutional_health_index(): Aggregates metrics across historical or departmental submissions.
2. detect_cross_institutional_anomalies(): Scans multiple institutional submissions to flag:
   - Duplicate land survey / khasra numbers claimed by different institutions.
   - Overlapping full-time faculty appointments ("Ghost Faculty") registered across different colleges.
3. DashboardAnalyticsService: Generates executive statistics and feeds for the frontend dashboard.
"""

from collections import defaultdict
from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

from app.schemas.analytics import (
    CrossInstitutionalAnomaly,
    DashboardSummaryResponse,
    InstitutionalHealthIndexResult,
    InstitutionalSubmissionRecord,
)

logger = logging.getLogger(__name__)


def calculate_institutional_health_index(
    submissions: List[InstitutionalSubmissionRecord],
) -> InstitutionalHealthIndexResult:
    """Calculate the Institutional Health Index (IHI) aggregating historical/departmental submissions.

    Weighted Formula:
    - Regulatory Compliance (35%): Mean Layer 4 compliance score.
    - Forensic Integrity (25%): Mean (100 - Layer 2 tampering score).
    - Cryptographic Provenance (20%): Percentage of submissions with verified PKI & authoritative QR.
    - Infrastructure & Cadre Stability (20%): Stability of student-faculty ratio and classroom sufficiency.
    """
    if not submissions:
        return InstitutionalHealthIndexResult(
            institution_id="UNKNOWN",
            institution_name="No Submissions Provided",
            health_index=0.0,
            grade="C (Critical)",
            component_scores={
                "regulatory_compliance": 0.0,
                "forensic_authenticity": 0.0,
                "cryptographic_provenance": 0.0,
                "cadre_infrastructure_stability": 0.0,
            },
            total_submissions_analyzed=0,
            risk_assessment="HIGH_RISK",
            recommendations=["Submit foundational application data for evaluation."],
        )

    inst_id = submissions[0].institution_id
    inst_name = submissions[0].institution_name

    # 1. Component 1: Regulatory Compliance
    compliance_scores = [s.compliance_score for s in submissions]
    avg_compliance = sum(compliance_scores) / len(compliance_scores)

    # 2. Component 2: Forensic Authenticity
    forensic_scores = [max(0.0, 100.0 - s.tampering_score) for s in submissions]
    avg_forensic = sum(forensic_scores) / len(forensic_scores)

    # 3. Component 3: Cryptographic Provenance
    pki_flags = [100.0 if s.pki_verified else 0.0 for s in submissions]
    avg_crypto = sum(pki_flags) / len(pki_flags)

    # 4. Component 4: Cadre & Infrastructure Stability
    stability_scores = []
    for s in submissions:
        score = 80.0
        if s.faculty_count >= 50:
            score += 10.0
        elif s.faculty_count < 30:
            score -= 20.0

        if s.classrooms_count >= 16:
            score += 10.0
        elif s.classrooms_count < 12:
            score -= 15.0

        if s.land_area_acres >= 5.0:
            score += 5.0
        stability_scores.append(max(0.0, min(100.0, score)))

    avg_stability = sum(stability_scores) / len(stability_scores)

    # Weighted Composite IHI
    health_index = round(
        (avg_compliance * 0.35)
        + (avg_forensic * 0.25)
        + (avg_crypto * 0.20)
        + (avg_stability * 0.20),
        2,
    )
    health_index = min(100.0, max(0.0, health_index))

    # Grade & Risk Assessment
    if health_index >= 85.0:
        grade = "A+ (Exemplary)"
        risk = "LOW_RISK"
        recs = ["Maintain current gold-standard compliance cadence and digital signature posture."]
    elif health_index >= 70.0:
        grade = "A (Compliant)"
        risk = "LOW_RISK"
        recs = ["Regularize minor faculty cadre distributions to qualify for autonomy relaxation."]
    elif health_index >= 50.0:
        grade = "B (Deficient)"
        risk = "MODERATE_RISK"
        recs = [
            "Rectify faculty shortage in specific departments.",
            "Upgrade instructional classroom counts to satisfy divisions formula.",
        ]
    else:
        grade = "C (Critical)"
        risk = "HIGH_RISK"
        recs = [
            "Severe regulatory deficiencies or tampering anomalies detected.",
            "Urgent statutory inspection recommended prior to intake renewal.",
        ]

    return InstitutionalHealthIndexResult(
        institution_id=inst_id,
        institution_name=inst_name,
        health_index=health_index,
        grade=grade,
        component_scores={
            "regulatory_compliance": round(avg_compliance, 2),
            "forensic_authenticity": round(avg_forensic, 2),
            "cryptographic_provenance": round(avg_crypto, 2),
            "cadre_infrastructure_stability": round(avg_stability, 2),
        },
        total_submissions_analyzed=len(submissions),
        risk_assessment=risk,
        recommendations=recs,
    )


def normalize_identifier(raw: str) -> str:
    """Normalize survey numbers or faculty names for canonical cross-matching."""
    cleaned = re.sub(r"[^A-Za-z0-9]", "", str(raw or "").upper())
    # Strip common administrative noise prefixes for land survey / plot numbers
    for prefix in (
        "SURVEYNO",
        "SURVEYNUM",
        "SURVEY",
        "SYNO",
        "SY",
        "PLOTNO",
        "PLOTNUM",
        "PLOT",
        "KHASRANO",
        "KHASRA",
        "NO",
    ):
        if cleaned.startswith(prefix) and len(cleaned) > len(prefix):
            cleaned = cleaned[len(prefix):]
            break
    return cleaned


def detect_cross_institutional_anomalies(
    submissions: List[InstitutionalSubmissionRecord],
) -> List[CrossInstitutionalAnomaly]:
    """Scan submissions across institutions to flag land collisions and ghost faculty overlaps."""
    anomalies: List[CrossInstitutionalAnomaly] = []

    # -----------------------------------------------------------------------
    # 1. Land Survey Number Collision Detection
    # -----------------------------------------------------------------------
    survey_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    for sub in submissions:
        for s_num in sub.survey_numbers:
            norm_key = normalize_identifier(s_num)
            if not norm_key or len(norm_key) < 2:
                continue
            survey_map[norm_key].append(
                {
                    "raw_survey": s_num,
                    "institution_id": sub.institution_id,
                    "institution_name": sub.institution_name,
                    "submission_id": sub.submission_id,
                    "academic_year": sub.academic_year,
                    "land_area_acres": sub.land_area_acres,
                }
            )

    for norm_survey, records in survey_map.items():
        # Check if claimed by multiple distinct institution IDs
        distinct_inst_ids = {r["institution_id"] for r in records}
        if len(distinct_inst_ids) > 1:
            raw_display = records[0]["raw_survey"]
            conflicting_list = []
            inst_names = []
            for r in records:
                conflicting_list.append(
                    {
                        "institution_id": r["institution_id"],
                        "institution_name": r["institution_name"],
                        "submission_id": r["submission_id"],
                        "academic_year": r["academic_year"],
                        "claimed_land_acres": r["land_area_acres"],
                    }
                )
                inst_names.append(f"{r['institution_name']} ({r['institution_id']})")

            anomalies.append(
                CrossInstitutionalAnomaly(
                    anomaly_id=f"ANOM-LAND-{uuid.uuid4().hex[:8].upper()}",
                    anomaly_type="DUPLICATE_LAND_PARCEL",
                    severity="CRITICAL",
                    entity_identifier=raw_display,
                    conflicting_institutions=conflicting_list,
                    description=(
                        f"Land Parcel / Survey Number '{raw_display}' is simultaneously claimed by multiple "
                        f"distinct institutions: {', '.join(set(inst_names))}. "
                        "Double-pledging of title deeds violates AICTE Chapter 2 Land Norms."
                    ),
                    recommended_action=(
                        "Issue immediate statutory show-cause notice and require Revenue Authority "
                        "demarcation verification for both applicant Trusts."
                    ),
                )
            )

    # -----------------------------------------------------------------------
    # 2. Overlapping Faculty ("Ghost Faculty") Registration Detection
    # -----------------------------------------------------------------------
    faculty_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    for sub in submissions:
        for fac in sub.faculty_roster:
            # Match by explicit UID/PAN if present, or canonical Name + Qualification
            uid = fac.get("uid") or fac.get("pan") or fac.get("aadhaar")
            name = fac.get("name", "").strip()
            qual = fac.get("qualification", "").strip()

            if uid:
                fac_key = f"UID_{normalize_identifier(uid)}"
            elif name and qual:
                fac_key = f"NAME_{normalize_identifier(name)}_{normalize_identifier(qual)}"
            elif name:
                fac_key = f"NAME_{normalize_identifier(name)}"
            else:
                continue

            faculty_map[fac_key].append(
                {
                    "raw_name": name or uid,
                    "designation": fac.get("designation", "Faculty"),
                    "institution_id": sub.institution_id,
                    "institution_name": sub.institution_name,
                    "submission_id": sub.submission_id,
                    "academic_year": sub.academic_year,
                }
            )

    for fac_key, records in faculty_map.items():
        distinct_inst_ids = {r["institution_id"] for r in records}
        if len(distinct_inst_ids) > 1:
            raw_display = records[0]["raw_name"]
            conflicting_list = []
            inst_summary = []
            for r in records:
                conflicting_list.append(
                    {
                        "institution_id": r["institution_id"],
                        "institution_name": r["institution_name"],
                        "submission_id": r["submission_id"],
                        "academic_year": r["academic_year"],
                        "designation": r["designation"],
                    }
                )
                inst_summary.append(f"{r['institution_name']} as {r['designation']}")

            anomalies.append(
                CrossInstitutionalAnomaly(
                    anomaly_id=f"ANOM-FAC-{uuid.uuid4().hex[:8].upper()}",
                    anomaly_type="GHOST_FACULTY_OVERLAP",
                    severity="HIGH",
                    entity_identifier=raw_display,
                    conflicting_institutions=conflicting_list,
                    description=(
                        f"Faculty member '{raw_display}' is concurrently registered as regular full-time faculty "
                        f"across distinct institutions: {', '.join(set(inst_summary))}. "
                        "Dual full-time employment constitutes ghost faculty violation under AICTE Annexure 5.2."
                    ),
                    recommended_action=(
                        "De-register faculty member from approved rosters and penalize both institutions "
                        "by reducing sanctioned student intake proportionally."
                    ),
                )
            )

    return anomalies


class DashboardAnalyticsService:
    """Singleton service managing in-memory repository of institutional submissions and dashboard metrics."""

    _instance: Optional["DashboardAnalyticsService"] = None

    def __new__(cls) -> "DashboardAnalyticsService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.submissions = []
            cls._instance._seed_benchmark_data()
        return cls._instance

    def _seed_benchmark_data(self) -> None:
        """Seed realistic institutional submissions to bootstrap anomaly detection and dashboard metrics."""
        self.submissions = [
            # College 1: Compliant Engineering College
            InstitutionalSubmissionRecord(
                submission_id="SUB-2024-ENG-01",
                institution_id="1-3324567891",
                institution_name="Sardar Patel College of Engineering",
                department_or_programme="Engineering and Technology",
                academic_year="2024-2025",
                trust_score=88.5,
                compliance_score=85.0,
                tampering_score=8.5,
                pki_verified=True,
                faculty_count=60,
                classrooms_count=16,
                land_area_acres=7.5,
                survey_numbers=["Survey-42/1A", "Survey-42/1B"],
                faculty_roster=[
                    {"name": "Dr. Ramesh Patil", "uid": "PAN-ABCD1234E", "qualification": "Ph.D", "designation": "Professor"},
                    {"name": "Dr. Sunita Sharma", "uid": "PAN-EFGH5678I", "qualification": "Ph.D", "designation": "Associate Professor"},
                    {"name": "Prof. Amit Verma", "uid": "PAN-IJKL9012M", "qualification": "M.Tech", "designation": "Assistant Professor"},
                ],
                verdict="VERIFIED",
                timestamp="2026-10-25T14:30:00Z",
            ),
            # College 2: Engineering College colliding on Survey-42/1B (Duplicate Land Anomaly!)
            InstitutionalSubmissionRecord(
                submission_id="SUB-2024-ENG-02",
                institution_id="1-4458923110",
                institution_name="Apex Global Institute of Technology",
                department_or_programme="Engineering and Technology",
                academic_year="2024-2025",
                trust_score=62.0,
                compliance_score=55.0,
                tampering_score=38.0,
                pki_verified=False,
                faculty_count=45,
                classrooms_count=12,
                land_area_acres=4.0,
                survey_numbers=["Survey-42/1B", "Survey-88/2C"],  # Collision on 42/1B!
                faculty_roster=[
                    {"name": "Dr. Ramesh Patil", "uid": "PAN-ABCD1234E", "qualification": "Ph.D", "designation": "Professor"},  # Ghost Faculty Collision!
                    {"name": "Prof. Rajesh Gupta", "uid": "PAN-MNOP3456Q", "qualification": "M.Tech", "designation": "Assistant Professor"},
                ],
                verdict="NON_COMPLIANT",
                timestamp="2026-10-25T16:00:00Z",
            ),
            # College 3: Management Institute
            InstitutionalSubmissionRecord(
                submission_id="SUB-2024-MGMT-03",
                institution_id="1-7788990011",
                institution_name="Symbiosis Centre for Management Studies",
                department_or_programme="Management",
                academic_year="2024-2025",
                trust_score=92.0,
                compliance_score=90.0,
                tampering_score=5.0,
                pki_verified=True,
                faculty_count=35,
                classrooms_count=14,
                land_area_acres=2.5,
                survey_numbers=["Survey-99/4D"],
                faculty_roster=[
                    {"name": "Dr. Priya Deshmukh", "uid": "PAN-QRST7890U", "qualification": "Ph.D", "designation": "Professor"},
                    {"name": "Dr. Vikram Joshi", "uid": "PAN-UVWX1234Y", "qualification": "Ph.D", "designation": "Associate Professor"},
                ],
                verdict="VERIFIED",
                timestamp="2026-10-25T18:15:00Z",
            ),
            # College 4: Deficient Pharmacy College
            InstitutionalSubmissionRecord(
                submission_id="SUB-2024-PHARM-04",
                institution_id="1-9922334455",
                institution_name="Sunrise College of Pharmacy",
                department_or_programme="Pharmacy",
                academic_year="2024-2025",
                trust_score=54.0,
                compliance_score=48.0,
                tampering_score=45.0,
                pki_verified=False,
                faculty_count=20,
                classrooms_count=8,
                land_area_acres=1.8,
                survey_numbers=["Survey-112/5E"],
                faculty_roster=[
                    {"name": "Dr. Sunita Sharma", "uid": "PAN-EFGH5678I", "qualification": "Ph.D", "designation": "Professor"},  # Ghost Faculty with College 1!
                ],
                verdict="NON_COMPLIANT",
                timestamp="2026-10-26T09:00:00Z",
            ),
        ]

    def add_submission(self, record: InstitutionalSubmissionRecord) -> None:
        """Register a new institutional submission in memory."""
        self.submissions.append(record)

    def get_all_submissions(self) -> List[InstitutionalSubmissionRecord]:
        """Retrieve all active submissions."""
        return list(self.submissions)

    def get_anomalies(self) -> List[CrossInstitutionalAnomaly]:
        """Detect and return all cross-institutional anomalies."""
        return detect_cross_institutional_anomalies(self.submissions)

    def get_health_indices(self) -> List[InstitutionalHealthIndexResult]:
        """Calculate and return IHI for all distinct institutions in records."""
        grouped: Dict[str, List[InstitutionalSubmissionRecord]] = defaultdict(list)
        for s in self.submissions:
            grouped[s.institution_id].append(s)

        results = []
        for inst_id, subs in grouped.items():
            results.append(calculate_institutional_health_index(subs))
        return results

    def get_dashboard_summary(self) -> DashboardSummaryResponse:
        """Produce comprehensive aggregated metrics for frontend compliance dashboard."""
        subs = self.submissions
        total_audits = len(subs)

        if total_audits == 0:
            return DashboardSummaryResponse()

        verified_count = sum(1 for s in subs if s.verdict.upper() == "VERIFIED")
        approval_rate = round((verified_count / total_audits) * 100.0, 2)
        avg_compliance = round(sum(s.compliance_score for s in subs) / total_audits, 2)
        avg_trust = round(sum(s.trust_score for s in subs) / total_audits, 2)

        verdict_counts: Dict[str, int] = defaultdict(int)
        for s in subs:
            verdict_counts[s.verdict.upper()] += 1

        risk_counts: Dict[str, int] = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
        for s in subs:
            if s.tampering_score <= 20.0:
                risk_counts["LOW"] += 1
            elif s.tampering_score <= 40.0:
                risk_counts["MEDIUM"] += 1
            else:
                risk_counts["HIGH"] += 1

        anomalies = self.get_anomalies()
        health_indices = self.get_health_indices()

        recent_feed = []
        for s in sorted(subs, key=lambda x: x.timestamp, reverse=True)[:10]:
            recent_feed.append(
                {
                    "submission_id": s.submission_id,
                    "institution_id": s.institution_id,
                    "institution_name": s.institution_name,
                    "programme": s.department_or_programme,
                    "verdict": s.verdict,
                    "trust_score": s.trust_score,
                    "compliance_score": s.compliance_score,
                    "tampering_score": s.tampering_score,
                    "timestamp": s.timestamp,
                }
            )

        return DashboardSummaryResponse(
            total_audits_conducted=total_audits,
            overall_approval_rate=approval_rate,
            average_compliance_score=avg_compliance,
            average_trust_score=avg_trust,
            verdict_breakdown=dict(verdict_counts),
            risk_level_breakdown=risk_counts,
            active_anomalies_count=len(anomalies),
            active_anomalies=anomalies,
            recent_health_indices=health_indices,
            recent_audits=recent_feed,
        )


# Global singleton instance
dashboard_service = DashboardAnalyticsService()
