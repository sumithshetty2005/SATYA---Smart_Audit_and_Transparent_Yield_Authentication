"""AICTE Compliance Engine - FastAPI Application Entry Point."""

import os
import shutil
import tempfile
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import fitz

from app.forensics.ela_checker import analyze_document_forensics
from app.ingestion.layout_engine import LayoutLMv3IngestionEngine
from app.knowledge.agent import execute_compliance_audit
from app.schemas.compliance import (
    ComplianceAuditRequest,
    ComplianceAuditResponse,
)
from app.schemas.payload import (
    ExtractedApplicationPayload,
    ForensicsResponse,
    SourceVerificationReceipt,
)
from app.routers.analytics_router import router as analytics_router
from app.routers.audit_router import router as audit_router
from app.routers.problem_statements_router import router as problem_statements_router
from app.routers.verification_router import router as verification_router
from app.routers.vision_router import router as vision_router
from app.verification.source_verifier import verify_authoritative_source

# Initialize FastAPI application
app = FastAPI(
    title="AICTE Compliance Engine & Problem Statement Provider Portal API",
    version="1.0.0",
    description="Layer 1 Layout Analysis | Layer 2 Visual Forensics | Layer 3 Authoritative Source Verification | Layer 4 Agentic GraphRAG | Layer 5 Analytics & Audit Reporting | Layer 6 Merkle Audit Chain Engine | Problem Statement Provider Portal",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Layer Routers
app.include_router(analytics_router)
app.include_router(audit_router)
app.include_router(problem_statements_router)
app.include_router(verification_router)
app.include_router(vision_router)

# Engine singleton holder (lazy initialization to optimize startup time)
_layout_engine: Optional[LayoutLMv3IngestionEngine] = None


def get_layout_engine() -> LayoutLMv3IngestionEngine:
    """Retrieve or lazily initialize the LayoutLMv3 ingestion engine singleton."""
    global _layout_engine
    if _layout_engine is None:
        _layout_engine = LayoutLMv3IngestionEngine()
    return _layout_engine


@app.get("/", tags=["Health"])
async def root(request: Request) -> Any:
    """Root endpoint: serves the AICTE Problem Statement Provider Portal if requested via browser, or JSON API status."""
    frontend_index = os.path.join(os.path.dirname(__file__), "frontend", "dist", "index.html")
    accept_header = request.headers.get("accept", "")
    if "text/html" in accept_header and os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    return {
        "status": "online",
        "service": "AICTE Compliance Engine & Problem Statement Provider Portal",
        "layers": "Layer 1 Ingestion | Layer 2 Forensics | Layer 3 Source Verification | Layer 4 GraphRAG | Layer 5 Analytics | PS Provider Portal",
        "portal_url": "/portal",
        "docs_url": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """Service health check probe."""
    return {"status": "healthy"}


@app.post("/api/v1/prototype/review-packet", tags=["Prototype Demo"])
async def review_synthetic_packet(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Run a transparent, fixture-specific review of the supplied synthetic test packet.

    This prototype endpoint does not call AICTE, DigiLocker, a bank, or any issuer.
    Unknown PDFs are inventoried but receive no generated compliance findings.
    """
    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prototype packet review currently accepts PDF files only.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Prototype PDF limit is 25 MB.")

    try:
        with fitz.open(stream=content, filetype="pdf") as document:
            page_text = [page.get_text("text") for page in document]
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not read this PDF: {exc}") from exc

    full_text = "\n".join(page_text).casefold()
    markers = (
        "satya application review test packet",
        "demo-aicte-test-001",
        "navajyoti institute of applied technology",
        "synthetic test data",
    )
    recognized = sum(marker in full_text for marker in markers) >= 3
    base = {
        "success": True,
        "prototype_mode": True,
        "packet_recognized": recognized,
        "file_name": filename,
        "page_count": len(page_text),
        "case_id": "SATYA-DEMO-2026-001" if recognized else None,
    }
    if not recognized:
        return {
            **base,
            "review_status": "UNSUPPORTED_PROTOTYPE_INPUT",
            "summary": "This prototype currently demonstrates a review against the supplied SATYA synthetic test packet. No compliance findings were generated for this PDF.",
            "observations": [],
        }

    def has(page: int, value: str) -> bool:
        # PDF text extraction commonly inserts line breaks inside a sentence.
        normalized_page = " ".join(page_text[page - 1].casefold().split())
        normalized_value = " ".join(value.casefold().split())
        return normalized_value in normalized_page

    observations = [
        {"id": "programme-difference", "title": "Programme list differs from prior snapshot", "status": "REVIEW", "pages": [2, 3], "detail": "The application requests three programmes; the synthetic prior-approval snapshot lists two. Compare the records during human review."},
        {"id": "intake-difference", "title": "Requested intake differs from prior snapshot", "status": "REVIEW", "pages": [2, 3], "detail": "The application declares 480 seats and the prior snapshot lists 360. This is a cross-document difference, not a regulatory verdict."},
        {"id": "faculty-evidence", "title": "Faculty evidence is incomplete", "status": "INCOMPLETE_EVIDENCE", "pages": [2, 3, 4], "detail": "The application declares 24 faculty, the prior snapshot lists 22, and the supplied roster contains only 8 rows. The other 16 records are absent, so no final staffing deficiency is inferred."},
        {"id": "fire-certificate", "title": "Fire certificate is past its printed expiry date", "status": "DATE_EXPIRED_SOURCE_UNVERIFIED", "pages": [2, 5], "detail": "The packet date is 26 October 2026 and the printed expiry is 31 December 2024. No issuer confirmation was supplied."},
        {"id": "issuer-verification", "title": "Issuer verification unavailable", "status": "NOT_VERIFIED", "pages": [1, 3, 5, 7], "detail": "This packet contains no real digital signature, issuer-verifiable QR code, issuer response, or connected registry result. No DigiLocker or AICTE verification is claimed."},
        {"id": "floor-plan-scale", "title": "Floor-plan area not calculated", "status": "NOT_ASSESSED", "pages": [6], "detail": "The plan is explicitly schematic and has no usable scale or dimensions. Area and geometry compliance cannot be assessed from this evidence."},
        {"id": "campus-geolocation", "title": "Campus location not verified", "status": "NOT_AVAILABLE", "pages": [7], "detail": "The illustration has no GPS or camera EXIF metadata. No coordinates or geofence result are inferred."},
        {"id": "fee-confirmation", "title": "Fee amount and payment not verified", "status": "NOT_AVAILABLE", "pages": [5], "detail": "The receipt amount is illustrative and no bank or payment confirmation is supplied."},
        {"id": "forensics-caution", "title": "Forensic checks are advisory", "status": "ADVISORY_ONLY", "pages": [1, 7], "detail": "The packet describes ordinary generated PDF metadata. Any visual or metadata anomaly would be a signal for review, not proof of tampering."},
    ]
    # Guard the fixture result against unexpected packet revisions that lose key source statements.
    if not (has(1, "not issued by AICTE") and has(6, "no architectural scale") and has(7, "no GPS or camera EXIF")):
        return {
            **base,
            "packet_recognized": False,
            "case_id": None,
            "review_status": "FIXTURE_VERSION_UNRECOGNIZED",
            "summary": "The PDF resembles the demo packet, but key limitation statements did not match. No findings were generated.",
            "observations": [],
        }

    return {
        **base,
        "review_status": "SYNTHETIC_REVIEW_REQUIRED",
        "summary": "Synthetic packet recognized. Differences and evidence gaps are shown for demonstration; this is not an AICTE decision or a live issuer verification.",
        "observations": observations,
        "source_checks": {"digital_signature": "NOT_PRESENT", "issuer_qr": "NOT_PRESENT", "registry_connection": "NOT_CONNECTED", "payment_confirmation": "NOT_CONNECTED"},
        "rules_assessment": "NOT_RUN - no configured authoritative rule source was queried by this prototype review.",
        "checks_performed": ["PDF page inventory", "Synthetic fixture identification", "Fixture-defined cross-document comparisons"],
    }


@app.post(
    "/api/v1/extract",
    response_model=Dict[str, Any],
    tags=["Ingestion"],
    summary="Extract compliance payload from an uploaded AICTE application PDF page",
)
@app.post(
    "/ingest",
    response_model=Dict[str, Any],
    tags=["Ingestion"],
    summary="Ingest and process an AICTE application PDF page",
)
async def extract_pdf_page(
    file: UploadFile = File(..., description="Uploaded PDF document"),
    page_num: int = Form(0, description="Zero-indexed target page number"),
) -> Dict[str, Any]:
    """Extract tokens, classified layout regions, and compliance fields from a PDF page.

    - Converts page to image and extracts normalized 2D bounding boxes.
    - Runs inference with microsoft/layoutlmv3-base.
    - Classifies regions into document headers, key-value pairs, tables, and seals.
    - Formats output into ExtractedApplicationPayload schema.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF documents (.pdf) are supported.",
        )

    # Write uploaded stream to temporary file for PyMuPDF processing
    temp_dir = tempfile.mkdtemp()
    temp_pdf_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        engine = get_layout_engine()
        result = engine.process_pdf_page(pdf_path=temp_pdf_path, page_num=page_num)

        # Ensure result validates against the Pydantic schema
        ExtractedApplicationPayload(**result)

        return {
            "success": True,
            "filename": file.filename,
            "page_num": page_num,
            "data": result,
        }

    except IndexError as idx_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested page number is out of bounds: {str(idx_err)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failed: {str(exc)}",
        )
    finally:
        # Clean up temporary file and directory
        if os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
            except OSError:
                pass
        if os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except OSError:
                pass


@app.post(
    "/api/v1/forensics",
    response_model=ForensicsResponse,
    tags=["Forensics"],
    summary="Execute Layer 2 Visual Forensics analysis on an uploaded PDF or image document",
)
async def analyze_forensics_endpoint(
    file: UploadFile = File(..., description="Uploaded PDF or image document (.pdf, .jpg, .png, etc.)"),
    page_num: int = Form(0, description="Zero-indexed page number to evaluate for PDF documents"),
) -> ForensicsResponse:
    """Analyze uploaded document using Layer 2 Visual Forensics Engine.

    - Computes Error Level Analysis (ELA) pixel difference matrices and anomaly score.
    - Evaluates OpenCV cv2.Laplacian blur and detects localized text flattening/smoothing.
    - Inspects PDF metadata timestamps, producer signatures, and incremental revision history.
    - Returns comprehensive forensics score breakdown and tampering verdict.
    """
    filename = file.filename or "unknown_document"
    allowed_exts = (".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp")
    if not any(filename.lower().endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{filename}'. Allowed formats: {', '.join(allowed_exts)}",
        )

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        forensics_result = analyze_document_forensics(
            file_input=file_bytes,
            filename=filename,
            page_num=page_num,
        )

        return ForensicsResponse(**forensics_result)

    except IndexError as idx_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Page number out of bounds: {str(idx_err)}",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forensics analysis failed: {str(exc)}",
        )


@app.post(
    "/api/v1/verify-source",
    response_model=SourceVerificationReceipt,
    tags=["Verification"],
    summary="Execute Layer 3 Authoritative Source Verification (PKI Digital Signatures & 2D QR Codes)",
)
async def verify_source_endpoint(
    file: UploadFile = File(..., description="Uploaded PDF document to verify (.pdf)"),
) -> SourceVerificationReceipt:
    """Execute Layer 3 Authoritative Source Verification on an uploaded PDF document.

    - Scans PDF page renders for embedded 2D QR codes using native OpenCV and PyMuPDF.
    - Validates QR payloads against authoritative council/government domains.
    - Validates PKI digital signatures and parses embedded X.509 certificates using pyhanko.
    - Verifies cryptographic hash integrity and detects unauthorized post-signing file modifications.
    - Returns structured cryptographic verification receipt.
    """
    filename = file.filename or "document.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Source verification requires a PDF document (.pdf).",
        )

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        if not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File header does not match standard PDF document structure.",
            )

        receipt = verify_authoritative_source(
            pdf_input=file_bytes,
            filename=filename,
        )

        return SourceVerificationReceipt(**receipt)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authoritative source verification failed: {str(exc)}",
        )


@app.post(
    "/api/v1/compliance-audit",
    response_model=ComplianceAuditResponse,
    tags=["Compliance"],
    summary="Execute Layer 4 Agentic GraphRAG & Regulatory Verification Audit",
)
async def compliance_audit_endpoint(
    request: ComplianceAuditRequest,
) -> ComplianceAuditResponse:
    """Execute Layer 4 Agentic GraphRAG & Regulatory Engine Audit.

    - Receives consolidated payload from Layers 1-3 (extracted application fields,
      visual forensics score breakdown, and PKI/QR source verification receipts)
      along with institutional facts (programme, location type, sanctioned intake).
    - Queries hybrid BM25 + BGE-M3 vector store with Reciprocal Rank Fusion (RRF).
    - Performs controlled 1- to 2-hop Neo4j knowledge graph traversal dynamically
      filtered on programme and location facts.
    - Validates regulatory evidence provenance (edition currency, active exceptions).
    - Coordinates LangGraph multi-agent orchestration (Retriever, Evaluator, Synthesizer)
      with dual LLMs (primary Groq Llama 3.1 8B with automatic Google Gemini API fallback).
    - Returns structured AICTE regulatory audit report citing exact handbook sections and clauses.
    """
    try:
        report = execute_compliance_audit(request)
        return report
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance audit orchestration failed: {str(exc)}",
        )


# Mount Frontend Assets & Static Portal
_frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
_frontend_assets = os.path.join(_frontend_dist, "assets")

if os.path.exists(_frontend_assets):
    app.mount("/assets", StaticFiles(directory=_frontend_assets), name="assets")

if os.path.exists(_frontend_dist):
    app.mount("/portal", StaticFiles(directory=_frontend_dist, html=True), name="portal")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
