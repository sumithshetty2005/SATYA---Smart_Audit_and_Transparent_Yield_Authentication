"""Tests for Layer 3 DigiLocker & Authoritative Source Verification API."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.verification_router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_get_available_registries():
    """Verify listing of authorized national and state registries."""
    resp = client.get("/api/v1/verification/digilocker/registries")
    assert resp.status_code == 200
    registries = resp.json()
    assert len(registries) >= 5
    ids = [r["id"] for r in registries]
    assert "MAHABHUMI_LAND_RECORD" in ids
    assert "E_BHULEKH_UP" in ids
    assert "BHOOMI_KA" in ids
    assert "FIRE_NOC_PORTAL" in ids
    assert "COA_REGISTRY" in ids


def test_digilocker_oauth_flow():
    """Verify DigiLocker / NeGD API Setu OAuth 2.0 authorization and token exchange."""
    # 1. Initiate OAuth
    auth_resp = client.post(
        "/api/v1/verification/digilocker/oauth/authorize",
        json={
            "institution_id": "1-4458923110",
            "redirect_uri": "http://localhost:5173/verification/oauth/callback",
            "scope": "org.digilocker.land_records org.digilocker.edu_affiliation",
        },
    )
    assert auth_resp.status_code == 200
    auth_data = auth_resp.json()
    assert "authorization_url" in auth_data
    assert auth_data["client_id"] == "AICTE_SETU_SANDBOX_2026"
    assert "state" in auth_data

    # 2. Exchange token
    token_resp = client.post(
        "/api/v1/verification/digilocker/oauth/token",
        json={
            "code": "AUTH_CODE_MOCK_XYZ",
            "state": auth_data["state"],
            "client_id": auth_data["client_id"],
        },
    )
    assert token_resp.status_code == 200
    token_data = token_resp.json()
    assert token_data["token_type"] == "Bearer"
    assert token_data["access_token"].startswith("dl_tok_")
    assert token_data["status"] == "ACTIVE_CONSENT_GRANTED"
    assert token_data["citizen_aadhaar_last4"] == "8819"


def test_reconcile_match_outcome():
    """Verify successful 100% authoritative MATCH outcome."""
    resp = client.post(
        "/api/v1/verification/digilocker/reconcile",
        json={
            "institution_id": "1-9988776655",
            "institution_name": "Vidyapeeth Institute of Technology",
            "deed_number": "DEED-DEL-2021-4402",
            "survey_number": "Plot-18/Sec-62",
            "claimed_acreage": 5.25,
            "target_registry": "E_BHULEKH_UP",
            "forced_outcome": "MATCH",
        },
    )
    assert resp.status_code == 200
    receipt = resp.json()
    assert receipt["outcome"] == "MATCH"
    assert "100% Integrity" in receipt["status_title"]
    assert receipt["authoritative_record"] is not None
    assert receipt["authoritative_record"]["authoritative_acreage"] == 5.25
    assert len(receipt["raw_payload_digest"]) == 64
    assert len(receipt["hmac_signature"]) == 64
    assert len(receipt["merkle_leaf_hash"]) == 64


def test_reconcile_mismatch_outcome():
    """Verify regulatory MISMATCH outcome reporting acreage deficit and ownership discrepancy."""
    resp = client.post(
        "/api/v1/verification/digilocker/reconcile",
        json={
            "institution_id": "1-4458923110",
            "institution_name": "Apex Global Institute of Technology",
            "deed_number": "DEED-PUN-2019-9821",
            "survey_number": "Survey-42/1B",
            "claimed_acreage": 7.20,
            "target_registry": "MAHABHUMI_LAND_RECORD",
            "forced_outcome": "MISMATCH",
        },
    )
    assert resp.status_code == 200
    receipt = resp.json()
    assert receipt["outcome"] == "MISMATCH"
    assert "Discrepancy" in receipt["status_title"]
    assert receipt["authoritative_record"] is not None
    assert receipt["authoritative_record"]["authoritative_acreage"] == 4.00
    assert len(receipt["discrepancies"]) >= 2
    assert receipt["discrepancies"][0]["field"] == "land_area_acres"
    assert receipt["discrepancies"][0]["delta"] == -3.20


def test_reconcile_pending_outcome():
    """Verify PENDING outcome when citizen/signatory consent is awaited."""
    resp = client.post(
        "/api/v1/verification/digilocker/reconcile",
        json={
            "institution_id": "1-5544332211",
            "institution_name": "Pending Consent College",
            "forced_outcome": "PENDING",
        },
    )
    assert resp.status_code == 200
    receipt = resp.json()
    assert receipt["outcome"] == "PENDING"
    assert "Consent" in receipt["status_title"]
    assert receipt["authoritative_record"] is None


def test_reconcile_unavailable_outcome():
    """Verify UNAVAILABLE outcome when upstream state registry times out."""
    resp = client.post(
        "/api/v1/verification/digilocker/reconcile",
        json={
            "institution_id": "1-2233445566",
            "institution_name": "Offline Gateway University",
            "forced_outcome": "UNAVAILABLE",
        },
    )
    assert resp.status_code == 200
    receipt = resp.json()
    assert receipt["outcome"] == "UNAVAILABLE"
    assert "Unavailable" in receipt["status_title"]
    assert "504" in receipt["status_title"] or "Gateway" in receipt["status_title"]


def test_reconcile_manual_review_outcome():
    """Verify MANUAL_REVIEW outcome for joint ancestral khata requiring demarcation."""
    resp = client.post(
        "/api/v1/verification/digilocker/reconcile",
        json={
            "institution_id": "1-7788990011",
            "institution_name": "Demarcation Dispute Institute",
            "forced_outcome": "MANUAL_REVIEW",
        },
    )
    assert resp.status_code == 200
    receipt = resp.json()
    assert receipt["outcome"] == "MANUAL_REVIEW"
    assert "Manual Scrutiny" in receipt["status_title"]
    assert receipt["authoritative_record"] is not None
    assert receipt["authoritative_record"]["encumbrance_status"] == "UNDEMARCATED_JOINT_SHARE"
