"""Test suite for Layer 6: Web Dashboard & Cryptographic Audit Chain Engine.

Problem Statement SH26261: AICTE Regulatory Compliance & Verification Architecture.
"""

import hashlib
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def sha256_hash(data: str) -> str:
    return "0x" + hashlib.sha256(data.encode("utf-8")).hexdigest()


def combine_hashes(left: str, right: str) -> str:
    clean_left = left[2:] if left.startswith("0x") else left
    clean_right = right[2:] if right.startswith("0x") else right
    return sha256_hash(clean_left + clean_right)


def test_merkle_verification_valid():
    """Verify that recalculating canonical Merkle root from leaf hashes returns CHAIN_VALID."""
    leaves = [
        sha256_hash("STEP_1_INGESTION_PAYLOAD"),
        sha256_hash("STEP_2_ELA_FORGERY_RECEIPT"),
        sha256_hash("STEP_3_DIGILOCKER_RECEIPT"),
        sha256_hash("STEP_4_NEO4J_GRAPHRAG_EVAL"),
    ]

    # Calculate expected root
    p1 = combine_hashes(leaves[0], leaves[1])
    p2 = combine_hashes(leaves[2], leaves[3])
    expected_root = combine_hashes(p1, p2)

    response = client.post(
        "/api/v1/merkle/verify",
        json={
            "application_id": "AICTE-2026-NRO-8849201",
            "leaf_hashes": leaves,
            "expected_root": expected_root,
            "simulate_tamper": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["status"] == "CHAIN_VALID"
    assert data["computed_root"].lower() == expected_root.lower()


def test_merkle_verification_tampered():
    """Verify that tampering/bit-flipping any block hash triggers ALERT_DATA_TAMPERED."""
    leaves = [
        sha256_hash("STEP_1_INGESTION_PAYLOAD"),
        sha256_hash("STEP_2_ELA_FORGERY_RECEIPT"),
        sha256_hash("STEP_3_DIGILOCKER_RECEIPT"),
        sha256_hash("STEP_4_NEO4J_GRAPHRAG_EVAL"),
    ]

    p1 = combine_hashes(leaves[0], leaves[1])
    p2 = combine_hashes(leaves[2], leaves[3])
    expected_root = combine_hashes(p1, p2)

    response = client.post(
        "/api/v1/merkle/verify",
        json={
            "application_id": "AICTE-2026-NRO-8849201",
            "leaf_hashes": leaves,
            "expected_root": expected_root,
            "simulate_tamper": True,  # simulate tampering
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["status"] == "ALERT_DATA_TAMPERED"


def test_officer_decision_commit():
    """Verify that submitting an officer scrutiny order appends a signed leaf node."""
    response = client.post(
        "/api/v1/merkle/decision",
        json={
            "application_id": "AICTE-2026-NRO-8849201",
            "institution_name": "Vidyapeeth Institute of Technology & Management",
            "officer_name": "Dr. Akshay Verma",
            "officer_role": "Senior Scrutiny Officer",
            "officer_signature": "SHA256:OFFICER-DS-NRO-8849-VERMA-2026",
            "action_type": "DISCREPANCY_NOTICE",
            "notes": "Issued 15-day show-cause notice regarding altered land deed on Khasra 884/2A.",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMMITTED"
    assert data["leaf_hash"].startswith("0x")
    assert data["action_recorded"] == "DISCREPANCY_NOTICE"
