"""Architectural CAD & Floor Plan Spatial Vector Calculator (Layer 5).

Implements:
1. Multi-page vector drawing extraction via PyMuPDF (fitz.get_drawings()).
2. Room boundary construction and spatial polygon modeling using Shapely.
3. Scale-aware area calculation (reporting scale unavailable when missing).
4. Room categorization (Instructional, Admin, Amenity, Circulation, Fire Egress).
5. AICTE APH 2024-2027 normative compliance validation (advisory flags).
6. Deterministic SHA-256 Merkle Leaf Hash generation for Layer 6 audit log.
"""

from __future__ import annotations

import hashlib
import io
import math
import re
from typing import Any, Dict, List, Optional, Tuple, Union

import fitz  # PyMuPDF
from shapely.geometry import Polygon, box


# Default AICTE Approval Process Handbook (APH) 2024-2027 Normative Guidelines
DEFAULT_APH_CAD_NORMS = {
    "classroom_min_sqm": 66.0,
    "computer_lab_min_sqm": 150.0,
    "workshop_min_sqm": 200.0,
    "principal_office_min_sqm": 30.0,
    "min_circulation_ratio": 0.25,  # 25% minimum circulation area
    "max_fire_egress_distance_m": 30.0,  # Max 30m travel distance to exit
}


def _read_pdf_bytes(pdf_input: Union[str, bytes, io.BytesIO]) -> bytes:
    if isinstance(pdf_input, bytes):
        return pdf_input
    elif isinstance(pdf_input, io.BytesIO):
        pdf_input.seek(0)
        return pdf_input.read()
    elif isinstance(pdf_input, str):
        with open(pdf_input, "rb") as f:
            return f.read()
    raise ValueError(f"Unsupported PDF input type: {type(pdf_input)}")


def detect_scale_from_text(text: str) -> Optional[float]:
    """Inspects drawing text for scale annotations (e.g. '1:100', '1:50', 'Scale 1cm = 1m').

    Returns meters per PDF point if detected, or None.
    Standard PDF points: 72 points per inch (1 inch = 0.0254m -> 1 pt = 0.000352778m at 1:1 scale).
    """
    # Look for patterns like "1:100", "1:50", "1 : 200"
    match = re.search(r"1\s*:\s*(\d{2,4})", text, re.IGNORECASE)
    if match:
        ratio = float(match.group(1))
        # 1 unit on paper = ratio units in real life
        # At 72 pt/inch, 1 pt is ~0.000352778m on paper * ratio = meters in reality
        return 0.0003528 * ratio

    # Look for "1cm = 1m" or "1 cm : 1 m" -> 1:100
    if re.search(r"1\s*cm\s*=\s*1\s*m", text, re.IGNORECASE):
        return 0.03528

    return None


class ArchitecturalCADEngine:
    """Engine for extracting, computing, and verifying vector floor plan geometry."""

    def __init__(self, aph_norms: Optional[Dict[str, float]] = None):
        self.norms = {**DEFAULT_APH_CAD_NORMS, **(aph_norms or {})}

    def analyze_floor_plan(
        self,
        pdf_input: Union[str, bytes, io.BytesIO],
        page_index: int = 0,
        manual_scale_meters_per_pt: Optional[float] = None,
        target_viewport_width: float = 620.0,
        target_viewport_height: float = 460.0,
    ) -> Dict[str, Any]:
        """Extract vector paths, compute room polygons via Shapely, and evaluate norms.

        Args:
            pdf_input: Raw PDF bytes, BytesIO, or file path.
            page_index: Zero-indexed page to evaluate.
            manual_scale_meters_per_pt: Optional explicit scale factor.
            target_viewport_width: Width to normalize SVG coordinates for the UI.
            target_viewport_height: Height to normalize SVG coordinates for the UI.

        Returns:
            Evidence-linked CAD analysis results matching Layer 5 frontend specifications.
        """
        pdf_bytes = _read_pdf_bytes(pdf_input)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        if len(doc) == 0:
            raise ValueError("Provided PDF document contains no pages.")
        if page_index < 0 or page_index >= len(doc):
            page_index = 0

        page = doc[page_index]
        page_rect = page.rect
        page_w = page_rect.width
        page_h = page_rect.height

        # 1. Extract vector drawings and text blocks
        drawings = page.get_drawings()
        text_blocks = page.get_text("blocks")
        full_text = " ".join([b[4] for b in text_blocks if len(b) > 4])

        # 2. Determine scale ratio
        scale_meters_per_pt = manual_scale_meters_per_pt
        scale_source = "MANUAL_INPUT" if manual_scale_meters_per_pt else "TEXT_ANNOTATION"

        if not scale_meters_per_pt:
            scale_meters_per_pt = detect_scale_from_text(full_text)

        scale_available = scale_meters_per_pt is not None
        if not scale_available:
            page_count = len(doc)
            doc.close()
            return {
                "success": True,
                "processing_status": "SCALE_REQUIRED",
                "method": "PYMUPDF_SHAPELY_VECTOR_ANALYSIS",
                "evidence_location": f"Page {page_index + 1} of PDF",
                "page_count": page_count,
                "page_dimensions": {"width_pt": page_w, "height_pt": page_h},
                "scale_info": {"scale_available": False, "scale_meters_per_pt": None, "scale_source": "NOT_FOUND"},
                "cadFloorPlan": {
                    "totalAreaSqm": 0.0,
                    "carpetAreaSqm": 0.0,
                    "circulationRatio": 0.0,
                    "requiredCirculationRatio": self.norms["min_circulation_ratio"],
                    "nearestFireExitDistanceM": None,
                    "maxAllowedEgressDistanceM": self.norms["max_fire_egress_distance_m"],
                    "polygons": [],
                },
                "advisory_flags": [],
                "limitations": [
                    "No drawing scale was found. Area, circulation, and egress measurements were not calculated.",
                    "Supply a verified scale or request qualified manual review before making measurements.",
                ],
                "recommended_action": "Manual review required; do not infer area or compliance from this drawing.",
                "merkle_leaf_hash": None,
            }

        # Conversion factor from PDF points area to Square Meters
        # (points * scale_meters_per_pt)^2
        area_scale_factor = scale_meters_per_pt**2

        # 3. Viewport normalization factors for SVG (0,0 to target_viewport)
        scale_x = target_viewport_width / max(1.0, page_w)
        scale_y = target_viewport_height / max(1.0, page_h)

        # 4. Extract closed rectangles/paths into Shapely polygons
        extracted_polygons: List[Dict[str, Any]] = []
        raw_polygons: List[Tuple[Polygon, fitz.Rect]] = []

        # Find rects and closed bounding boxes
        for d in drawings:
            rect = d.get("rect")
            if not rect:
                continue
            r = fitz.Rect(rect)
            # Filter out tiny noise (lines, icons) and full page bounding box
            if r.width < 25 or r.height < 25:
                continue
            if r.width >= page_w * 0.95 and r.height >= page_h * 0.95:
                continue

            # Construct Shapely Polygon
            poly = box(r.x0, r.y0, r.x1, r.y1)
            raw_polygons.append((poly, r))

        # 5. Label and categorize rooms based on spatial text matching
        labeled_rooms: List[Dict[str, Any]] = []
        total_cad_area_sqm = 0.0
        carpet_area_sqm = 0.0
        circulation_area_sqm = 0.0

        # Process each polygon
        for idx, (poly, r) in enumerate(raw_polygons[:6]):
            # Find any text block inside or closest to this rectangle
            contained_texts: List[str] = []
            for b in text_blocks:
                bx0, by0, bx1, by1, btext = b[:5]
                b_rect = fitz.Rect(bx0, by0, bx1, by1)
                if r.intersects(b_rect):
                    cleaned = btext.strip().replace("\n", " ")
                    if cleaned:
                        contained_texts.append(cleaned)

            matched_text = " ".join(contained_texts).lower()

            # Determine category and name
            category = "UNKNOWN"
            room_name = f"Unlabelled zone {idx + 1}"

            if "lab" in matched_text or "computer" in matched_text:
                category = "INSTRUCTIONAL"
                room_name = f"Computer Lab {idx + 1}"
            elif "class" in matched_text or "lecture" in matched_text:
                category = "INSTRUCTIONAL"
                room_name = f"Classroom {101 + idx}"
            elif "corridor" in matched_text or "passage" in matched_text or "stair" in matched_text:
                category = "CIRCULATION"
                room_name = "Central Corridor & Passageway"
            elif "principal" in matched_text or "office" in matched_text or "admin" in matched_text:
                category = "ADMIN"
                room_name = "Administrative & Principal Office"
            elif "fire" in matched_text or "exit" in matched_text or "egress" in matched_text:
                category = "FIRE_EGRESS"
                room_name = "Fire Egress & Stairwell"
            elif "toilet" in matched_text or "restroom" in matched_text or "amenity" in matched_text:
                category = "AMENITY"
                room_name = "Amenities & Restrooms"

            # Compute area in Sq. Meters
            calculated_area_sqm = round(poly.area * area_scale_factor, 1)
            # Do not replace implausible measurements with fabricated room defaults.
            area_plausible = category != "UNKNOWN" and 15.0 <= calculated_area_sqm <= 500.0
            if not area_plausible:
                calculated_area_sqm = 0.0

            # Normalize coordinates to UI viewport SVG points string
            # e.g., "x1,y1 x2,y2 x3,y3 x4,y4"
            vx0 = round(r.x0 * scale_x, 1)
            vy0 = round(r.y0 * scale_y, 1)
            vx1 = round(r.x1 * scale_x, 1)
            vy1 = round(r.y1 * scale_y, 1)

            svg_points = f"{vx0},{vy0} {vx1},{vy0} {vx1},{vy1} {vx0},{vy1}"

            # Evaluate APH Compliance status
            status = "UNASSESSED"
            compliance_note = "No configured comparison for this room category; not assessed."
            if area_plausible and category == "INSTRUCTIONAL":
                status = "PASS"
                compliance_note = "Area satisfies configured comparison threshold."
                if "lab" in room_name.lower():
                    if calculated_area_sqm < self.norms["computer_lab_min_sqm"]:
                        status = "DEFICIENT"
                        compliance_note = (
                            f"Lab area {calculated_area_sqm} m² is below APH threshold "
                            f"of {self.norms['computer_lab_min_sqm']} m²."
                        )
                else:
                    if calculated_area_sqm < self.norms["classroom_min_sqm"]:
                        status = "DEFICIENT"
                        compliance_note = (
                            f"Classroom area {calculated_area_sqm} m² is below APH threshold "
                            f"of {self.norms['classroom_min_sqm']} m²."
                        )
            elif area_plausible and category == "ADMIN":
                status = "PASS"
                compliance_note = "Area satisfies configured comparison threshold."
                if calculated_area_sqm < self.norms["principal_office_min_sqm"]:
                    status = "DEFICIENT"
                    compliance_note = (
                        f"Principal/Admin area {calculated_area_sqm} m² is below APH norm "
                        f"of {self.norms['principal_office_min_sqm']} m²."
                    )

            total_cad_area_sqm += calculated_area_sqm
            if category in ("INSTRUCTIONAL", "ADMIN"):
                carpet_area_sqm += calculated_area_sqm
            elif category == "CIRCULATION":
                circulation_area_sqm += calculated_area_sqm

            labeled_rooms.append(
                {
                    "id": f"poly-room-{idx + 1}",
                    "roomName": room_name,
                    "category": category,
                    "areaSqm": calculated_area_sqm,
                    "points": svg_points,
                    "boundingBox": [int(vx0), int(vy0), int(vx1), int(vy1)],
                    "status": status,
                    "complianceNote": compliance_note,
                    "calculatedBy": "Shapely Vector GIS Engine",
                }
            )

        # 6. Circulation ratio
        circulation_ratio = round(circulation_area_sqm / total_cad_area_sqm, 3) if total_cad_area_sqm > 0 else 0.0

        # Egress routing requires explicit exit geometry and remains unmeasured here.
        nearest_fire_exit_m = None

        # 8. Advisory Limitations & Notes
        limitations: List[str] = []
        limitations.append(f"Scale detected from text annotations ({scale_source}).")
        if not labeled_rooms:
            limitations.append("No room polygons could be extracted from the supplied vector drawing.")
        limitations.append("Fire egress distance is not calculated by this prototype.")

        # 9. Merkle Leaf Hash computation
        digest_preimage = f"LAYER5_CAD:{hashlib.sha256(pdf_bytes).hexdigest()}:{page_index}:{scale_source}"
        merkle_leaf_hash = hashlib.sha256(digest_preimage.encode()).hexdigest()

        return {
            "success": True,
            "processing_status": "COMPLETED",
            "method": "PYMUPDF_SHAPELY_VECTOR_ANALYSIS",
            "evidence_location": f"Page {page_index + 1} of PDF",
            "page_count": len(doc),
            "page_dimensions": {"width_pt": page_w, "height_pt": page_h},
            "scale_info": {
                "scale_available": scale_available,
                "scale_meters_per_pt": scale_meters_per_pt,
                "scale_source": scale_source,
            },
            "cadFloorPlan": {
                "totalAreaSqm": round(total_cad_area_sqm, 1),
                "carpetAreaSqm": round(carpet_area_sqm, 1),
                "circulationRatio": circulation_ratio,
                "requiredCirculationRatio": self.norms["min_circulation_ratio"],
                "nearestFireExitDistanceM": nearest_fire_exit_m,
                "maxAllowedEgressDistanceM": self.norms["max_fire_egress_distance_m"],
                "polygons": labeled_rooms,
            },
            "advisory_flags": [
                p["complianceNote"] for p in labeled_rooms if p["status"] == "DEFICIENT"
            ],
            "limitations": limitations,
            "recommended_action": (
                "Review extracted room polygons in the interactive canvas. Measurements are advisory; egress distance requires a separate verified method."
            ),
            "merkle_leaf_hash": merkle_leaf_hash,
        }


# Singleton holder
_cad_engine_instance: Optional[ArchitecturalCADEngine] = None


def get_cad_engine() -> ArchitecturalCADEngine:
    global _cad_engine_instance
    if _cad_engine_instance is None:
        _cad_engine_instance = ArchitecturalCADEngine()
    return _cad_engine_instance
