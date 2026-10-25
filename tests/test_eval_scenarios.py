"""Evaluation test suite executing the 8 regulatory compliance scenarios.

Evaluates:
Category 1: Land, Built-Up Area & Infrastructure Norms
- Case 1.1: B.Tech Engineering College Land Continuity & Distance Verification (Uttarakhand)
- Case 1.2: Minimum Classroom Count Calculation for B.Tech Institute

Category 2: TER Charges & Financial Compliance
- Case 2.1: New Private Engineering College TER Processing Fee
- Case 2.2: Operational Expense Funds Requirement at Scrutiny

Category 3: Faculty Ratios, Cadre & Qualification Norms
- Case 3.1: Under Graduate Engineering Student-Faculty Ratio (SFR) & Cadre Ratio
- Case 3.2: Professor of Practice & Adjunct Faculty Cap

Category 4: Open and Distance Learning (ODL) & Online Learning (OL)
- Case 4.1: Permissibility of Distance Learning in Engineering & Technology
- Case 4.2: ODL / Online Learning Academic Staff at Headquarters
"""

import sys
from pathlib import Path
from typing import Any, Dict

# Ensure root on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from app.knowledge.agent import execute_compliance_audit
from app.schemas.compliance import (
    ComplianceAuditRequest,
    ComplianceAuditResponse,
    InstitutionFacts,
)
from app.schemas.payload import ExtractedApplicationPayload, LandDetails


def run_eval_case_1_1() -> Dict[str, Any]:
    """Test Case 1.1: B.Tech Engineering College Land Continuity & Distance Verification.

    Scenario: Existing engineering college in hilly area (Uttarakhand), 3 plots.
    Plot A is 1.2 km from Plot B; Plot B is 1.8 km from Plot C.
    Plot A houses Academic & Admin; Plot C houses sports ground.
    Ground Truth: APH Annexure 3.1 (g) & (h) -> COMPLIANT.
    """
    req = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-TC-1.1",
            institution_name="Himalayan Institute of Technology",
            programme="Engineering and Technology",
            location_type="Hilly Area",
            state="Uttarakhand",
            is_hilly_area=True,
            plot_details=[
                {"name": "Plot A", "usage": "Academic and Administrative areas", "distance_to_next_km": 1.2},
                {"name": "Plot B", "usage": "Hostel and Residential amenities", "distance_to_next_km": 1.8},
                {"name": "Plot C", "usage": "Sports Ground", "distance_to_next_km": 0.0},
            ],
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-TC-1.1",
            land_info=LandDetails(
                land_area_acres=8.0,
                land_use_certificate_valid=True,
            ),
            total_builtup_area_sqm=5000.0,
        ),
    )
    res = execute_compliance_audit(req)
    hilly_finding = next((f for f in res.findings if "hilly" in f.finding_id or "Annexure 3.1" in f.clause_reference), None)
    return {
        "test_case": "1.1",
        "title": "B.Tech Engineering College Land Continuity & Distance Verification",
        "category": "Category 1: Land, Built-Up Area & Infrastructure Norms",
        "finding": hilly_finding,
        "overall_status": res.overall_status,
        "score": res.compliance_score,
        "evidence": res.retrieved_evidence,
    }


def run_eval_case_1_2() -> Dict[str, Any]:
    """Test Case 1.2: Minimum Classroom Count Calculation for B.Tech Institute.

    Scenario: 4 courses * 2 divisions = 8 divisions/yr. Duration = 4 years.
    Formula: 8 * 4 * 0.5 = 16 classrooms. Provided = 12.
    Ground Truth: APH Annexure 3.2.1 (A) -> NON-COMPLIANT (Deficiency of 4 classrooms).
    """
    req = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-TC-1.2",
            institution_name="Pragmatic Institute of Engineering",
            programme="Engineering and Technology",
            location_type="Urban",
            courses_count=4,
            divisions_per_course=2,
            course_duration_years=4,
            classrooms_provided=12,
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-TC-1.2",
            land_info=LandDetails(land_area_acres=3.0, land_use_certificate_valid=True),
            total_builtup_area_sqm=4500.0,
        ),
    )
    res = execute_compliance_audit(req)
    cr_finding = next((f for f in res.findings if "classroom" in f.finding_id or "3.2.1 (A)" in f.clause_reference), None)
    return {
        "test_case": "1.2",
        "title": "Minimum Classroom Count Calculation for B.Tech Institute",
        "category": "Category 1: Land, Built-Up Area & Infrastructure Norms",
        "finding": cr_finding,
        "overall_status": res.overall_status,
        "score": res.compliance_score,
        "evidence": res.retrieved_evidence,
    }


def run_eval_case_2_1() -> Dict[str, Any]:
    """Test Case 2.1: New Private Engineering College TER Processing Fee.

    Scenario: Private registered Trust applies for setting up new UG Engineering college in Maharashtra.
    Remits Rs. 5.00 Lakh.
    Ground Truth: APH Chapter I, Clause 1.4.2, Table 1.1 (ii): Req Rs. 10.00 Lakh.
    Expected: NON-COMPLIANT (Underpaid TER Charges by Rs. 5.00 Lakh).
    """
    req = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-TC-2.1",
            institution_name="Vidya Vikas Trust",
            programme="Engineering and Technology",
            application_type="Setting Up New Institution",
            institution_category="Private",
            state="Maharashtra",
            ter_fee_paid_lakhs=5.00,
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-TC-2.1",
            land_info=LandDetails(land_area_acres=8.0, land_use_certificate_valid=True),
            total_builtup_area_sqm=4200.0,
        ),
    )
    res = execute_compliance_audit(req)
    ter_finding = next((f for f in res.findings if "ter" in f.finding_id or "1.4.2" in f.clause_reference), None)
    return {
        "test_case": "2.1",
        "title": "New Private Engineering College TER Processing Fee",
        "category": "Category 2: TER Charges & Financial Compliance",
        "finding": ter_finding,
        "overall_status": res.overall_status,
        "score": res.compliance_score,
        "evidence": res.retrieved_evidence,
    }


def run_eval_case_2_2() -> Dict[str, Any]:
    """Test Case 2.2: Operational Expense Funds Requirement at Scrutiny.

    Scenario: Private Trust applies to start new Management Institute (MBA) and shows Rs. 35 Lakh in FDRs.
    Ground Truth: APH Chapter I, Clause 1.5.3, Table 1.2 (vii): Req Rs. 50 Lakh.
    Expected: NON-COMPLIANT (Shortfall of Rs. 15 Lakh in operational funds).
    """
    req = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-TC-2.2",
            institution_name="Global Business School",
            programme="Management",
            application_type="Setting Up New Institution",
            operational_funds_lakhs=35.00,
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-TC-2.2",
            land_info=LandDetails(land_area_acres=1.5, land_use_certificate_valid=True),
            total_builtup_area_sqm=4000.0,
        ),
    )
    res = execute_compliance_audit(req)
    fund_finding = next((f for f in res.findings if "fund" in f.finding_id or "1.5.3" in f.clause_reference), None)
    return {
        "test_case": "2.2",
        "title": "Operational Expense Funds Requirement at Scrutiny",
        "category": "Category 2: TER Charges & Financial Compliance",
        "finding": fund_finding,
        "overall_status": res.overall_status,
        "score": res.compliance_score,
        "evidence": res.retrieved_evidence,
    }


def run_eval_case_3_1() -> Dict[str, Any]:
    """Test Case 3.1: Under Graduate Engineering Student-Faculty Ratio (SFR) & Cadre Ratio.

    Scenario: Approved intake 300/yr across 4 yrs (S = 1200).
    Department has 50 full-time faculty: 3 Professors, 7 Associate Professors, 40 Assistant Professors.
    Ground Truth: Annexure 5.2: SFR 1:20 -> Req 60 faculty. Cadre 1:2:6 -> 7 Prof, 13 Assoc Prof, 40 Asst Prof.
    Expected: NON-COMPLIANT (Overall faculty shortfall of 10 members; shortfall of 4 Professors and 6 Associate Professors).
    """
    req = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-TC-3.1",
            institution_name="National College of Engineering",
            programme="Engineering and Technology",
            total_enrolled_students=1200,
            professors_count=3,
            associate_professors_count=7,
            assistant_professors_count=40,
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-TC-3.1",
            land_info=LandDetails(land_area_acres=8.0, land_use_certificate_valid=True),
            total_builtup_area_sqm=6500.0,
        ),
    )
    res = execute_compliance_audit(req)
    cadre_finding = next((f for f in res.findings if "cadre" in f.finding_id or "Annexure 5.2" in f.clause_reference), None)
    return {
        "test_case": "3.1",
        "title": "Under Graduate Engineering SFR & Cadre Ratio",
        "category": "Category 3: Faculty Ratios, Cadre & Qualification Norms",
        "finding": cadre_finding,
        "overall_status": res.overall_status,
        "score": res.compliance_score,
        "evidence": res.retrieved_evidence,
    }


def run_eval_case_3_2() -> Dict[str, Any]:
    """Test Case 3.2: Professor of Practice & Adjunct Faculty Cap.

    Scenario: Autonomous Engineering College hires Adjunct Faculty and Professors of Practice totaling 22% of total required faculty.
    Ground Truth: APH Chapter VI, Clause 6.14 (d) (iii): Maximum limit 15%.
    Expected: NON-COMPLIANT (Exceeds 15% maximum permissible ceiling).
    """
    req = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-TC-3.2",
            institution_name="Autonomous Institute of Technology",
            programme="Engineering and Technology",
            total_enrolled_students=720,
            adjunct_and_pop_percentage=22.0,
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-TC-3.2",
            land_info=LandDetails(land_area_acres=5.0, land_use_certificate_valid=True),
            total_builtup_area_sqm=5000.0,
        ),
    )
    res = execute_compliance_audit(req)
    adj_finding = next((f for f in res.findings if "adjunct" in f.finding_id or "6.14" in f.clause_reference), None)
    return {
        "test_case": "3.2",
        "title": "Professor of Practice & Adjunct Faculty Cap",
        "category": "Category 3: Faculty Ratios, Cadre & Qualification Norms",
        "finding": adj_finding,
        "overall_status": res.overall_status,
        "score": res.compliance_score,
        "evidence": res.retrieved_evidence,
    }


def run_eval_case_4_1() -> Dict[str, Any]:
    """Test Case 4.1: Permissibility of Distance Learning in Engineering & Technology.

    Scenario: State Private University applies for B.Tech in CSE via ODL mode.
    Ground Truth: APH Chapter V, Clause 5.1 (b): Council shall NOT allow ODL/Online in Engineering & Technology.
    Expected: PROHIBITED / INVALID APPLICATION.
    """
    req = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-TC-4.1",
            institution_name="State Private University",
            programme="Engineering and Technology",
            delivery_mode="Open and Distance Learning (ODL)",
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-TC-4.1",
            land_info=LandDetails(land_area_acres=10.0, land_use_certificate_valid=True),
            total_builtup_area_sqm=5000.0,
        ),
    )
    res = execute_compliance_audit(req)
    odl_finding = next((f for f in res.findings if "prohibition" in f.finding_id or "5.1 (b)" in f.clause_reference), None)
    return {
        "test_case": "4.1",
        "title": "Permissibility of Distance Learning in Engineering & Technology",
        "category": "Category 4: Open and Distance Learning (ODL) & Online Learning (OL)",
        "finding": odl_finding,
        "overall_status": res.overall_status,
        "score": res.compliance_score,
        "evidence": res.retrieved_evidence,
    }


def run_eval_case_4_2() -> Dict[str, Any]:
    """Test Case 4.2: ODL / Online Learning Academic Staff at Headquarters.

    Scenario: Standalone Institution offering online MBA (enrolment = 3000 students) appoints 1 Professor (Head), 1 Associate Professor, 1 Assistant Professor.
    Ground Truth: APH Chapter V, Clause 5.3.3, Table 5.1: Req for up to 5000 students: 1 Professor, 1 Associate Professor, 2 Assistant Professors.
    Expected: NON-COMPLIANT (Shortfall of 1 Assistant Professor).
    """
    req = ComplianceAuditRequest(
        institution_facts=InstitutionFacts(
            institution_id="INST-TC-4.2",
            institution_name="Apex Online Management Institute",
            programme="Management",
            delivery_mode="Online Learning (OL)",
            total_enrolled_students=3000,
            odl_academic_staff={
                "professors": 1,
                "associate_professors": 1,
                "assistant_professors": 1,
            },
        ),
        extracted_data=ExtractedApplicationPayload(
            institution_id="INST-TC-4.2",
            land_info=LandDetails(land_area_acres=2.0, land_use_certificate_valid=True),
            total_builtup_area_sqm=4000.0,
        ),
    )
    res = execute_compliance_audit(req)
    staff_finding = next((f for f in res.findings if "odl_staff" in f.finding_id or "5.3.3" in f.clause_reference), None)
    return {
        "test_case": "4.2",
        "title": "ODL / Online Learning Academic Staff at Headquarters",
        "category": "Category 4: Open and Distance Learning (ODL) & Online Learning (OL)",
        "finding": staff_finding,
        "overall_status": res.overall_status,
        "score": res.compliance_score,
        "evidence": res.retrieved_evidence,
    }


if __name__ == "__main__":
    cases = [
        run_eval_case_1_1,
        run_eval_case_1_2,
        run_eval_case_2_1,
        run_eval_case_2_2,
        run_eval_case_3_1,
        run_eval_case_3_2,
        run_eval_case_4_1,
        run_eval_case_4_2,
    ]

    print("=" * 80)
    print("AICTE COMPLIANCE ENGINE — EVALUATION TEST EXECUTION")
    print("=" * 80)

    for fn in cases:
        out = fn()
        f = out["finding"]
        print(f"\n[TEST CASE {out['test_case']}] {out['title']}")
        print(f"Category: {out['category']}")
        print(f"Status Verdict: {f.status if f else 'N/A'}")
        print(f"Cited Clause: {f.clause_reference if f else 'N/A'}")
        print(f"Required Standard: {f.required_standard if f else 'N/A'}")
        print(f"Observed Actual: {f.actual_value if f else 'N/A'}")
        print(f"Gap Analysis: {f.gap_analysis if f else 'N/A'}")
        print(f"Corrective Action: {f.corrective_action if f else 'N/A'}")
        print(f"Overall Audit Status: {out['overall_status']} (Score: {out['score']}/100)")
        print("-" * 80)
