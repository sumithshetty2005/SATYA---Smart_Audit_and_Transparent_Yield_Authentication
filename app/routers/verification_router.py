"""Fail-closed Layer 3 verification routes for the local SATYA prototype.

These routes describe supported registry integrations but do not contact an issuer.
They must report unavailable until an authorized OAuth/API adapter is configured.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/verification", tags=["Layer 3 Verification"])


class VerificationOutcome(str, Enum):
    MATCH = "MATCH"
    MISMATCH = "MISMATCH"
    PENDING = "PENDING"
    UNAVAILABLE = "UNAVAILABLE"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class RegistryInfo(BaseModel):
    id: str
    name: str
    jurisdiction: str
    state: str
    category: str
    endpoint: str
    sandbox_active: bool
    description: str


AVAILABLE_REGISTRIES: List[RegistryInfo] = [
    RegistryInfo(
        id="MAHABHUMI_LAND_RECORD",
        name="Maharashtra e-Mahabhumi (7/12 & Bhunaksha Portal)",
        jurisdiction="Government of Maharashtra",
        state="Maharashtra",
        category="Land Revenue Records",
        endpoint="https://apisetu.gov.in/sandbox/dl/mahabhumi/v2/extract",
        sandbox_active=False,
        description="Reference endpoint only. SATYA has no authorized connection configured.",
    ),
    RegistryInfo(
        id="E_BHULEKH_UP",
        name="UP e-Bhulekh Land & Revenue Department",
        jurisdiction="Board of Revenue, Uttar Pradesh",
        state="Uttar Pradesh",
        category="Land Revenue Records",
        endpoint="https://apisetu.gov.in/sandbox/dl/up-bhulekh/v1/khasra",
        sandbox_active=False,
        description="Reference endpoint only. SATYA has no authorized connection configured.",
    ),
    RegistryInfo(
        id="BHOOMI_KA",
        name="Karnataka Bhoomi Land Registry",
        jurisdiction="Revenue Department, Government of Karnataka",
        state="Karnataka",
        category="Land Revenue Records",
        endpoint="https://apisetu.gov.in/sandbox/dl/karnataka-bhoomi/v3/rtc",
        sandbox_active=False,
        description="Reference endpoint only. SATYA has no authorized connection configured.",
    ),
    RegistryInfo(
        id="FIRE_NOC_PORTAL",
        name="National Directorate of Fire & Emergency Services",
        jurisdiction="Ministry of Home Affairs / State Fire Departments",
        state="National",
        category="Safety Clearances",
        endpoint="https://apisetu.gov.in/sandbox/dl/fire-noc/v1/validate",
        sandbox_active=False,
        description="Reference endpoint only. SATYA has no authorized connection configured.",
    ),
    RegistryInfo(
        id="COA_REGISTRY",
        name="Council of Architecture (CoA) Statutory Registry",
        jurisdiction="Statutory Body under Architects Act, 1972",
        state="National",
        category="Professional Licensure",
        endpoint="https://apisetu.gov.in/sandbox/dl/coa/v1/license-check",
        sandbox_active=False,
        description="Reference endpoint only. SATYA has no authorized connection configured.",
    ),
]


class DigiLockerOAuthInitRequest(BaseModel):
    institution_id: Optional[str] = None
    redirect_uri: Optional[str] = None
    scope: Optional[str] = None


class DigiLockerOAuthInitResponse(BaseModel):
    authorization_url: str
    client_id: str
    state: str
    scopes: List[str]
    expires_in_seconds: int
    session_id: str


class DigiLockerOAuthTokenRequest(BaseModel):
    code: str
    state: str
    client_id: Optional[str] = None


class DigiLockerOAuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    scope: str
    consent_artifact_id: str
    consent_timestamp: str
    citizen_aadhaar_last4: str
    status: str


class DigiLockerReconcileRequest(BaseModel):
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    document_type: Optional[str] = None
    deed_number: Optional[str] = None
    survey_number: Optional[str] = None
    claimed_acreage: Optional[float] = None
    target_registry: Optional[str] = None
    oauth_token: Optional[str] = None


class AuthoritativeRecordData(BaseModel):
    deed_number: str
    survey_number: str
    registered_owner: str
    authoritative_acreage: Optional[float] = None
    registration_date: str
    encumbrance_status: str
    zoning_classification: str
    issuing_authority: str
    state: str
    registry_source_url: str


class SourceVerificationReceipt(BaseModel):
    receipt_id: Optional[str] = None
    outcome: VerificationOutcome
    status_title: str
    status_description: str
    registry_code: str
    registry_name: str
    authoritative_record: Optional[AuthoritativeRecordData] = None
    claimed_record: Dict[str, Any] = Field(default_factory=dict)
    discrepancy_details: Optional[str] = None
    discrepancies: List[Dict[str, Any]] = Field(default_factory=list)
    oauth_consent_token: Optional[str] = None
    oauth_consent_timestamp: Optional[str] = None
    api_latency_ms: Optional[int] = None
    raw_payload_digest: Optional[str] = None
    hmac_signature: Optional[str] = None
    merkle_leaf_hash: Optional[str] = None
    timestamp: Optional[str] = None
    verification_mode: str = "NOT_CONFIGURED"


@router.get("/digilocker/registries", response_model=List[RegistryInfo])
async def get_available_registries() -> List[RegistryInfo]:
    """Return registry references and their actual connection status."""
    return AVAILABLE_REGISTRIES


@router.post("/digilocker/oauth/authorize", response_model=DigiLockerOAuthInitResponse)
async def initiate_digilocker_oauth(_: DigiLockerOAuthInitRequest) -> DigiLockerOAuthInitResponse:
    """Fail closed until a real DigiLocker client and callback are configured."""
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="DigiLocker OAuth is not configured. No authorization request was sent.",
    )


@router.post("/digilocker/oauth/token", response_model=DigiLockerOAuthTokenResponse)
async def exchange_digilocker_token(_: DigiLockerOAuthTokenRequest) -> DigiLockerOAuthTokenResponse:
    """Do not mint local placeholder tokens that look issuer-issued."""
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="DigiLocker token exchange is not configured. No access token was created.",
    )


@router.post("/digilocker/reconcile", response_model=SourceVerificationReceipt)
@router.post("/digilocker/requery", response_model=SourceVerificationReceipt)
async def reconcile_with_registry(request: DigiLockerReconcileRequest) -> SourceVerificationReceipt:
    """Return unavailable until an authorized registry adapter returns a real response."""
    registry = next(
        (item for item in AVAILABLE_REGISTRIES if item.id == request.target_registry),
        None,
    )
    registry_name = registry.name if registry else "Unselected registry"
    registry_code = registry.id if registry else "NOT_CONFIGURED"
    return SourceVerificationReceipt(
        outcome=VerificationOutcome.UNAVAILABLE,
        status_title="Registry integration not configured",
        status_description=(
            "No issuer request was made. Configure an authorized DigiLocker/API Setu client "
            "and registry adapter before reporting a match or mismatch."
        ),
        registry_code=registry_code,
        registry_name=registry_name,
        claimed_record={
            "institution_id": request.institution_id,
            "institution_name": request.institution_name,
            "deed_number": request.deed_number,
            "survey_number": request.survey_number,
            "claimed_acreage": request.claimed_acreage,
            "document_type": request.document_type,
        },
        verification_mode="NOT_CONFIGURED",
    )
