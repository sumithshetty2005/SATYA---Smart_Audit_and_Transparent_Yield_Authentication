"""Unit and integration tests for the Problem Statement Provider Portal API."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_list_problem_statements_all():
    """Verify listing all active AICTE problem statements."""
    response = client.get("/api/v1/problem-statements")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 8
    first = data[0]
    assert "id" in first
    assert "title" in first
    assert "domain" in first
    assert "grant_amount" in first


def test_filter_problem_statements_by_domain():
    """Verify domain filtering."""
    response = client.get("/api/v1/problem-statements?domain=Robotics")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(ps["domain"].lower() == "robotics" for ps in data)


def test_filter_problem_statements_by_search():
    """Verify search filter for keywords like 'Brahmi' or 'drone'."""
    response = client.get("/api/v1/problem-statements?search=Brahmi")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "AICTE-2027-PS01" in [d["id"] for d in data]


def test_get_problem_statement_detail():
    """Verify retrieving specific statement details."""
    response = client.get("/api/v1/problem-statements/AICTE-2027-PS01")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "AICTE-2027-PS01"
    assert "Brahmi" in data["title"]
    assert len(data["tech_stack"]) > 0


def test_get_portal_stats():
    """Verify aggregate platform metrics."""
    response = client.get("/api/v1/problem-statements/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_active_statements"] > 0
    assert stats["total_grants_allocated_crores"] > 0
    assert stats["partner_institutions"] > 0


def test_submit_problem_ticket_flow():
    """Verify the Ticket-Flow submission wizard endpoint."""
    payload = {
        "title": "Autonomous Underwater Inspection Robot for Coastal Ports",
        "organization_name": "Indian Institute of Science Bangalore",
        "organization_type": "Academic",
        "contact_email": "dean.rnd@iisc.ac.in",
        "contact_person": "Prof. R. Narayanan",
        "domain": "Robotics",
        "category": "Hybrid",
        "grant_amount_lakhs": 28.0,
        "urgency": "High",
        "summary": "Design subsea ROVs with sonar and visual SLAM to audit dock pilings for marine corrosion.",
        "detailed_spec": "Ports in Chennai and Mumbai experience rapid bio-fouling and pilings deterioration. A swarm of low-cost ROVs can inspect without human diver hazards.",
        "tech_stack": ["ROS2", "Acoustic Sonar", "Jetson Orin", "OpenCV"],
        "expected_duration_months": 12,
    }
    response = client.post("/api/v1/problem-statements/submit-ticket", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ticket_id"].startswith("TK-AICTE-2027-")
    assert data["status"] == "QUEUED_FOR_VERIFICATION"
    assert "verification_hash" in data
    assert data["compliance_precheck"]["status"] == "PASSED"


def test_apply_solution_proposal():
    """Verify submitting a solution proposal for an existing problem statement."""
    payload = {
        "team_name": "Aryabhata AI Labs",
        "team_lead": "Ananya Sharma",
        "institution": "IIT Bombay",
        "proposal_summary": "Vision Transformer model fine-tuned on palm-leaf multispectral scans with LoRA adapters.",
    }
    response = client.post("/api/v1/problem-statements/AICTE-2027-PS01/apply", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "PROPOSAL_ACCEPTED"
    assert "application_id" in res
