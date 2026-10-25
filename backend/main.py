"""AICTE Compliance Engine - FastAPI Application Entry Point."""

import os
import shutil
import tempfile
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from app.forensics.ela_checker import analyze_document_forensics
from app.ingestion.layout_engine import LayoutLMv3IngestionEngine
from app.schemas.payload import (
    ExtractedApplicationPayload,
    ForensicsResponse,
    SourceVerificationReceipt,
)
from app.verification.source_verifier import verify_authoritative_source

# Initialize FastAPI application
app = FastAPI(
    title="AICTE Compliance Engine API",
    version="1.0.0",
    description="Layer 1 Layout Analysis | Layer 2 Visual Forensics | Layer 3 Authoritative Source Verification",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engine singleton holder (lazy initialization to optimize startup time)
_layout_engine: Optional[LayoutLMv3IngestionEngine] = None


def get_layout_engine() -> LayoutLMv3IngestionEngine:
    """Retrieve or lazily initialize the LayoutLMv3 ingestion engine singleton."""
    global _layout_engine
    if _layout_engine is None:
        _layout_engine = LayoutLMv3IngestionEngine()
    return _layout_engine


@app.get("/", tags=["Health"])
async def root() -> Dict[str, str]:
    """Root status endpoint."""
    return {
        "status": "online",
        "service": "AICTE Compliance Engine",
        "layers": "Layer 1 - Ingestion | Layer 2 - Visual Forensics | Layer 3 - Source Verification",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """Service health check probe."""
    return {"status": "healthy"}


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
