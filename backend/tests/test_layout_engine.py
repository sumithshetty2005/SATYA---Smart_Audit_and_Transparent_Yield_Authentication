"""Unit and integration test for LayoutLMv3 ingestion engine and payload schemas."""

import os
import sys
from pathlib import Path

# Ensure root and backend are on sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
backend_dir = root_dir / "backend"
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import fitz

from app.ingestion.layout_engine import LayoutLMv3IngestionEngine
from app.schemas.payload import ExtractedApplicationPayload, FacultyRow, LandDetails


def create_sample_aicte_pdf(output_path: str) -> None:
    """Generate a realistic AICTE Extension of Approval sample document."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4

    # Header block
    page.insert_text((50, 50), "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", fontsize=14)
    page.insert_text((50, 70), "APPROVAL PROCESS 2024-25 EXTENSION OF APPROVAL (EoA)", fontsize=11)
    page.insert_text((50, 90), "Mandatory Disclosure and Compliance Report", fontsize=10)

    # Key-Value details
    page.insert_text((50, 140), "Permanent Institute Id : 1-4567891230", fontsize=10)
    page.insert_text((50, 160), "Current Application Number : 1-9876543210", fontsize=10)
    page.insert_text((50, 180), "Plot Number : Plot No. 102/B, Knowledge Park III", fontsize=10)
    page.insert_text((50, 200), "Total Land Area : 8.75 Acres", fontsize=10)
    page.insert_text((50, 220), "Land Use Certificate : Valid and In Order", fontsize=10)
    page.insert_text((50, 240), "Total Built-up Area : 18500.75 sqm", fontsize=10)

    # Faculty Listing
    page.insert_text((50, 290), "FACULTY DETAILS & NORMS", fontsize=12)
    page.insert_text((50, 315), "Dr. Ramesh Kumar, Professor, Computer Science & Engineering, Ph.D", fontsize=10)
    page.insert_text((50, 335), "Dr. Ananya Sen, Associate Professor, Electronics & Communication, Ph.D", fontsize=10)
    page.insert_text((50, 355), "Prof. Amit Verma, Assistant Professor, Information Technology, M.Tech", fontsize=10)

    # Seal block
    page.insert_text((50, 750), "Affix Seal & Signature of the Head of the Institution / Registrar", fontsize=10)

    doc.save(output_path)
    doc.close()


def test_layoutlmv3_ingestion():
    sample_pdf = os.path.abspath("backend/data/sample_docs/aicte_sample_test.pdf")
    create_sample_aicte_pdf(sample_pdf)
    assert os.path.exists(sample_pdf), "Sample PDF should be created."

    engine = LayoutLMv3IngestionEngine()
    result = engine.process_pdf_page(sample_pdf, page_num=0)

    print("\n--- INGESTION RESULT ---")
    print(f"Institution ID: {result.get('institution_id')}")
    print(f"Land Info: {result.get('land_info')}")
    print(f"Built-up Area (sqm): {result.get('total_builtup_area_sqm')}")
    print(f"Faculty Count: {len(result.get('faculty_list', []))}")
    print(f"Classified Regions: {list(result.get('classified_regions', {}).keys())}")

    # Pydantic schema validation
    payload = ExtractedApplicationPayload(**result)
    assert payload.institution_id == "1-4567891230", f"Unexpected inst id: {payload.institution_id}"
    assert "102/B" in payload.land_info.plot_number, f"Unexpected plot: {payload.land_info.plot_number}"
    assert payload.land_info.land_area_acres == 8.75, f"Unexpected area: {payload.land_info.land_area_acres}"
    assert payload.land_info.land_use_certificate_valid is True, "Land use certificate must be valid"
    assert payload.total_builtup_area_sqm == 18500.75, f"Unexpected area sqm: {payload.total_builtup_area_sqm}"
    assert len(payload.faculty_list) == 3, f"Expected 3 faculty, got {len(payload.faculty_list)}"

    # Check classified regions
    regions = result["classified_regions"]
    assert "document_headers" in regions
    assert "key_value_pairs" in regions
    assert "tables" in regions
    assert "seals" in regions
    assert len(regions["document_headers"]) > 0
    assert len(regions["key_value_pairs"]) > 0
    assert len(regions["seals"]) > 0

    print("\nSUCCESS: All schema validations and region classifications passed successfully!")


if __name__ == "__main__":
    test_layoutlmv3_ingestion()
