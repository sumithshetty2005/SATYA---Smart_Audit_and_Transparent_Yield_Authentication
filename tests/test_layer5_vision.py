"""Unit and integration tests for Layer 5 Infrastructure Computer Vision Module.

Tests:
1. Architectural CAD & Floor Plan Vector Calculator (PyMuPDF + Shapely).
2. Photo EXIF Geotag & Infrastructure Cadastral Validator (Pillow).
3. Real-Time Facility Machinery & Equipment Detector (Ultralytics YOLOv8n).
4. Consolidated Multi-Modal Infrastructure Audit Endpoint.
"""

import io
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image
import fitz

from app.routers.vision_router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def _generate_test_cad_pdf() -> bytes:
    """Creates a valid PDF with vector rectangles and room text."""
    doc = fitz.open()
    page = doc.new_page(width=620, height=460)

    # Room 1: Classroom
    page.draw_rect(fitz.Rect(50, 40, 280, 200), color=(0.2, 0.1, 0.05), width=2)
    page.insert_text(fitz.Point(70, 70), "Classroom 101 - 72 sqm", fontsize=10)

    # Room 2: Computer Lab
    page.draw_rect(fitz.Rect(320, 40, 580, 200), color=(0.05, 0.4, 0.2), width=2)
    page.insert_text(fitz.Point(340, 70), "Computer Science Lab - 165 sqm", fontsize=10)

    # Room 3: Corridor
    page.draw_rect(fitz.Rect(50, 230, 280, 410), color=(0.1, 0.2, 0.5), width=2)
    page.insert_text(fitz.Point(70, 260), "Central Passageway & Corridor", fontsize=10)

    # Room 4: Fire Exit
    page.draw_rect(fitz.Rect(320, 230, 580, 410), color=(0.5, 0.1, 0.1), width=2)
    page.insert_text(fitz.Point(340, 260), "Fire Egress & Stairwell", fontsize=10)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _generate_test_image(with_exif: bool = True) -> bytes:
    """Creates a valid JPEG image with optional EXIF metadata."""
    img = Image.new("RGB", (640, 480), color=(220, 200, 180))
    buf = io.BytesIO()

    if with_exif:
        exif = img.getexif()
        exif[271] = "Canon"  # Make
        exif[272] = "Canon EOS 90D"  # Model
        exif[305] = "Camera Firmware v1.2"  # Software
        exif[306] = "2026:10:26 12:30:00"  # DateTime
        img.save(buf, format="JPEG", exif=exif)
    else:
        img.save(buf, format="JPEG")

    return buf.getvalue()


def test_vision_health():
    """Verify Layer 5 vision health probe."""
    resp = client.get("/api/v1/layer5-vision/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "Shapely" in data["cad_engine"]
    assert "Pillow" in data["exif_validator"]
    assert "active" in data["yolo_detector"]


def test_analyze_cad_endpoint():
    """Verify PyMuPDF + Shapely vector CAD polygon extraction."""
    pdf_bytes = _generate_test_cad_pdf()
    files = {"file": ("cad_layout.pdf", pdf_bytes, "application/pdf")}
    data = {"page_index": 0}

    resp = client.post("/api/v1/layer5-vision/analyze-cad", files=files, data=data)
    assert resp.status_code == 200
    result = resp.json()

    assert result["success"] is True
    assert result["method"] == "PYMUPDF_SHAPELY_VECTOR_ANALYSIS"
    assert "cadFloorPlan" in result

    floor_plan = result["cadFloorPlan"]
    assert floor_plan["totalAreaSqm"] > 0
    assert len(floor_plan["polygons"]) >= 3
    assert floor_plan["circulationRatio"] > 0
    assert floor_plan["nearestFireExitDistanceM"] > 0

    first_poly = floor_plan["polygons"][0]
    assert "roomName" in first_poly
    assert "areaSqm" in first_poly
    assert "points" in first_poly
    assert len(result["merkle_leaf_hash"]) == 64


def test_inspect_exif_endpoint():
    """Verify photo EXIF geotag and distance inspection."""
    img_bytes = _generate_test_image(with_exif=True)
    files = {"file": ("campus_photo.jpg", img_bytes, "image/jpeg")}
    data = {
        "declared_latitude": 18.5204,
        "declared_longitude": 73.8567,
        "survey_tolerance_meters": 150.0,
    }

    resp = client.post("/api/v1/layer5-vision/inspect-exif", files=files, data=data)
    assert resp.status_code == 200
    result = resp.json()

    assert result["success"] is True
    assert result["method"] == "PILLOW_EXIF_GEOTAG_PARSER"
    assert "geotagPhoto" in result
    assert result["geotagPhoto"]["latitude"] != 0
    assert result["geotagPhoto"]["longitude"] != 0
    assert result["software_editing_flag"] is False
    assert len(result["merkle_leaf_hash"]) == 64


def test_detect_assets_endpoint():
    """Verify real YOLOv8-nano equipment detection and inventory check."""
    img_bytes = _generate_test_image(with_exif=False)
    files = {"file": ("lab_inspection.jpg", img_bytes, "image/jpeg")}
    data = {"confidence_threshold": 0.20}

    resp = client.post("/api/v1/layer5-vision/detect-assets", files=files, data=data)
    assert resp.status_code == 200
    result = resp.json()

    assert result["success"] is True
    assert "ULTRALYTICS" in result["method"]
    assert len(result["yoloDetections"]) > 0

    first_asset = result["yoloDetections"][0]
    assert "label" in first_asset
    assert "confidence" in first_asset
    assert len(first_asset["bbox"]) == 4
    assert "requiredQty" in first_asset
    assert "detectedQty" in first_asset
    assert "compliant" in first_asset
    assert len(result["merkle_leaf_hash"]) == 64


def test_consolidated_infrastructure_endpoint():
    """Verify consolidated multi-modal CAD and photo analysis."""
    pdf_bytes = _generate_test_cad_pdf()
    img_bytes = _generate_test_image()

    files = {
        "cad_file": ("floor_plan.pdf", pdf_bytes, "application/pdf"),
        "photo_file": ("lab_equipment.jpg", img_bytes, "image/jpeg"),
    }
    data = {"declared_latitude": 18.5204, "declared_longitude": 73.8567}

    resp = client.post("/api/v1/layer5-vision/analyze-infrastructure", files=files, data=data)
    assert resp.status_code == 200
    result = resp.json()

    assert result["success"] is True
    assert "cadFloorPlan" in result
    assert "geotagPhoto" in result
    assert "yoloDetections" in result
    assert len(result["merkle_root_seal"]) == 64
