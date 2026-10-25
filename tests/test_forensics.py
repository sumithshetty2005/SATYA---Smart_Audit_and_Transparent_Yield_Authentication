"""Unit tests for Layer 2 Visual Forensics Engine (ELA, blur/flattening, and PDF metadata)."""

import io
import os
import sys
from pathlib import Path

# Ensure root and backend are on sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import cv2
import fitz
import numpy as np
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.forensics.ela_checker import (
    analyze_document_forensics,
    compute_ela,
    detect_blur_and_flattening,
    extract_pdf_metadata,
)
from app.schemas.payload import ForensicsResponse
from main import app

client = TestClient(app)


def _generate_synthetic_document_image() -> Image.Image:
    """Generate a clean synthetic document image with sharp printed text lines."""
    img = Image.new("RGB", (600, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Simulate heading and text lines
    draw.rectangle([40, 40, 560, 60], fill=(20, 20, 20))
    for y in range(100, 750, 40):
        draw.line([50, y, 550, y], fill=(30, 30, 30), width=3)
        draw.line([50, y + 10, 400, y + 10], fill=(50, 50, 50), width=2)

    return img


def _create_sample_pdf(
    producer: str = "AICTE Government Server Engine",
    creator: str = "AICTE ERP 2024",
    mod_date_offset_hours: int = 0,
) -> bytes:
    """Create an in-memory sample PDF with specified metadata."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 60), "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", fontsize=14)
    page.insert_text((50, 100), "Permanent Institute ID: 1-4567891230", fontsize=11)
    page.insert_text((50, 130), "Total Built-Up Area: 18500 sqm", fontsize=11)

    meta = {
        "producer": producer,
        "creator": creator,
        "creationDate": "D:20240415100000+00'00'",
    }
    if mod_date_offset_hours > 0:
        meta["modDate"] = f"D:202404{15 + (mod_date_offset_hours // 24):02d}180000+00'00'"
    else:
        meta["modDate"] = "D:20240415100000+00'00'"

    doc.set_metadata(meta)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------


def test_compute_ela_clean_image():
    """Verify compute_ela runs on a clean synthetic document image."""
    img = _generate_synthetic_document_image()

    # Pre-save as JPEG to establish baseline compression
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    buf.seek(0)
    saved_img = Image.open(buf)

    result = compute_ela(saved_img, quality=90)

    assert "anomaly_score" in result
    assert "mean_difference" in result
    assert "max_difference" in result
    assert "high_error_ratio" in result
    assert "diff_matrix" in result
    assert result["diff_matrix"].shape == (800, 600)
    assert result["anomaly_score"] >= 0.0
    # Clean authentic JPEG should have low mean difference and moderate score
    assert result["mean_difference"] < 15.0
    assert result["is_suspicious"] is False


def test_compute_ela_spliced_tampering():
    """Verify compute_ela flags spliced / spliced compression mismatches."""
    img = _generate_synthetic_document_image()

    # Save background at quality 75
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=75)
    buf.seek(0)
    spliced_img = Image.open(buf).convert("RGB")

    # Splice an uncompressed high-frequency patch into the document
    patch = np.random.randint(0, 255, size=(180, 220, 3), dtype=np.uint8)
    patch_img = Image.fromarray(patch)
    spliced_img.paste(patch_img, (150, 250))

    result = compute_ela(spliced_img, quality=90)

    assert result["max_difference"] > 30.0
    assert result["anomaly_score"] > 30.0
    assert result["high_error_ratio"] > 0.02


def test_detect_blur_and_flattening_sharp_document():
    """Verify sharp document has high Laplacian variance and is not blurred."""
    img = _generate_synthetic_document_image()
    res = detect_blur_and_flattening(img, blur_threshold=100.0)

    assert res["global_laplacian_variance"] > 100.0
    assert res["is_blurred"] is False
    assert res["blur_score"] < 40.0


def test_detect_blur_and_flattening_blurred_document():
    """Verify heavily blurred document is correctly identified."""
    img = _generate_synthetic_document_image()
    img_np = np.array(img)
    blurred_np = cv2.GaussianBlur(img_np, (25, 25), 10.0)

    res = detect_blur_and_flattening(blurred_np, blur_threshold=100.0)

    assert res["is_blurred"] is True
    assert res["global_laplacian_variance"] < 100.0
    assert res["blur_score"] > 50.0


def test_detect_blur_and_flattening_erased_region():
    """Verify localized text flattening / erasing is flagged in suspicious_regions."""
    img = _generate_synthetic_document_image()
    # Erase a text block with a solid off-white patch simulating brush tool edit
    draw = ImageDraw.Draw(img)
    draw.rectangle([100, 200, 250, 350], fill=(210, 210, 210))

    res = detect_blur_and_flattening(img, tile_size=64)

    assert res["smoothed_regions_count"] > 0
    assert res["tampering_detected"] is True
    assert len(res["suspicious_regions"]) > 0
    first_region = res["suspicious_regions"][0]
    assert "x" in first_region
    assert "y" in first_region
    assert "variance" in first_region


def test_extract_pdf_metadata_clean():
    """Verify extract_pdf_metadata on authentic PDF returns low risk score and no flags."""
    pdf_bytes = _create_sample_pdf(
        producer="AICTE Government Server Engine",
        creator="AICTE ERP 2024",
        mod_date_offset_hours=0,
    )
    meta_res = extract_pdf_metadata(pdf_bytes)

    assert meta_res["producer"] == "AICTE Government Server Engine"
    assert meta_res["creator"] == "AICTE ERP 2024"
    assert meta_res["suspicious_producer"] is False
    assert meta_res["timestamp_discrepancy"] is False
    assert meta_res["revision_count"] == 1
    assert meta_res["metadata_risk_score"] < 30.0


def test_extract_pdf_metadata_suspicious_producer():
    """Verify extract_pdf_metadata detects tampering tools like Photoshop or Canva."""
    pdf_bytes = _create_sample_pdf(
        producer="Adobe Photoshop 24.1 (Windows)",
        creator="Adobe Photoshop CC",
    )
    meta_res = extract_pdf_metadata(pdf_bytes)

    assert meta_res["suspicious_producer"] is True
    assert meta_res["metadata_risk_score"] >= 50.0
    assert any("Photoshop" in a or "photoshop" in a for a in meta_res["anomalies"])


def test_extract_pdf_metadata_timestamp_discrepancy():
    """Verify extract_pdf_metadata flags PDFs modified days after creation."""
    pdf_bytes = _create_sample_pdf(
        producer="Clean Generator",
        mod_date_offset_hours=72,  # 3 days later
    )
    meta_res = extract_pdf_metadata(pdf_bytes)

    assert meta_res["timestamp_discrepancy"] is True
    assert meta_res["time_difference_seconds"] is not None
    assert meta_res["time_difference_seconds"] > 86400.0
    assert any("discrepancy" in a.lower() for a in meta_res["anomalies"])


def test_analyze_document_forensics_pdf():
    """Verify end-to-end analyze_document_forensics on PDF document."""
    pdf_bytes = _create_sample_pdf()
    result = analyze_document_forensics(pdf_bytes, filename="eoa_doc.pdf", page_num=0)

    assert result["success"] is True
    assert result["file_type"] == "pdf"
    assert "composite_score" in result
    assert "score_breakdown" in result
    assert result["score_breakdown"]["pdf_metadata"] is not None
    assert result["score_breakdown"]["ela"]["anomaly_score"] >= 0.0
    assert result["score_breakdown"]["blur_and_smoothing"]["global_laplacian_variance"] > 0.0


def test_api_forensics_endpoint_pdf():
    """Verify POST /api/v1/forensics endpoint with PDF file upload."""
    pdf_bytes = _create_sample_pdf()
    files = {"file": ("aicte_approval.pdf", pdf_bytes, "application/pdf")}
    data = {"page_num": 0}

    response = client.post("/api/v1/forensics", files=files, data=data)
    assert response.status_code == 200, f"Error: {response.text}"

    json_data = response.json()
    validated = ForensicsResponse(**json_data)
    assert validated.success is True
    assert validated.filename == "aicte_approval.pdf"
    assert validated.file_type == "pdf"
    assert validated.composite_score >= 0.0
    assert validated.risk_level in ["LOW", "MEDIUM", "HIGH"]
    assert validated.score_breakdown.pdf_metadata is not None
    assert validated.score_breakdown.ela is not None
    assert validated.score_breakdown.blur_and_smoothing is not None


def test_api_forensics_endpoint_image():
    """Verify POST /api/v1/forensics endpoint with image upload."""
    img = _generate_synthetic_document_image()
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    image_bytes = buf.getvalue()

    files = {"file": ("scanned_seal.jpg", image_bytes, "image/jpeg")}
    response = client.post("/api/v1/forensics", files=files)
    assert response.status_code == 200, f"Error: {response.text}"

    json_data = response.json()
    validated = ForensicsResponse(**json_data)
    assert validated.success is True
    assert validated.file_type == "jpg" or validated.file_type == "jpeg"
    assert validated.score_breakdown.pdf_metadata is None
    assert validated.score_breakdown.ela.mean_difference >= 0.0
    assert validated.score_breakdown.blur_and_smoothing.global_laplacian_variance > 0.0


def test_api_forensics_invalid_extension():
    """Verify POST /api/v1/forensics rejects unsupported file formats."""
    files = {"file": ("malicious_payload.exe", b"MZDummyHeader", "application/octet-stream")}
    response = client.post("/api/v1/forensics", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


if __name__ == "__main__":
    print("Running Layer 2 Forensics Unit Tests...")
    test_compute_ela_clean_image()
    print("[PASS] test_compute_ela_clean_image")
    test_compute_ela_spliced_tampering()
    print("[PASS] test_compute_ela_spliced_tampering")
    test_detect_blur_and_flattening_sharp_document()
    print("[PASS] test_detect_blur_and_flattening_sharp_document")
    test_detect_blur_and_flattening_blurred_document()
    print("[PASS] test_detect_blur_and_flattening_blurred_document")
    test_detect_blur_and_flattening_erased_region()
    print("[PASS] test_detect_blur_and_flattening_erased_region")
    test_extract_pdf_metadata_clean()
    print("[PASS] test_extract_pdf_metadata_clean")
    test_extract_pdf_metadata_suspicious_producer()
    print("[PASS] test_extract_pdf_metadata_suspicious_producer")
    test_extract_pdf_metadata_timestamp_discrepancy()
    print("[PASS] test_extract_pdf_metadata_timestamp_discrepancy")
    test_analyze_document_forensics_pdf()
    print("[PASS] test_analyze_document_forensics_pdf")
    test_api_forensics_endpoint_pdf()
    print("[PASS] test_api_forensics_endpoint_pdf")
    test_api_forensics_endpoint_image()
    print("[PASS] test_api_forensics_endpoint_image")
    test_api_forensics_invalid_extension()
    print("[PASS] test_api_forensics_invalid_extension")
    print("\nALL 12 TESTS PASSED PERFECTLY!")
