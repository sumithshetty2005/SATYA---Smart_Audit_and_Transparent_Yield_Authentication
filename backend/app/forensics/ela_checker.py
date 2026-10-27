"""Layer 2: Visual Forensics Engine.

Implements visual and structural tampering detection for AICTE compliance documents:
1. Error Level Analysis (ELA) pixel difference matrices and anomaly scoring.
2. OpenCV cv2.Laplacian blur detection and text flattening / smoothing analysis.
3. PDF metadata, producer signatures, timestamp discrepancy, and incremental revision inspection.
"""

from __future__ import annotations

import io
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import fitz  # PyMuPDF
import numpy as np
try:
    from pdfminer.pdfdocument import PDFDocument
    from pdfminer.pdfparser import PDFParser
except ImportError:  # pragma: no cover
    PDFDocument = None
    PDFParser = None
from PIL import Image

# Known image/PDF manipulation and tampering software signatures
SUSPICIOUS_PRODUCERS = [
    "photoshop",
    "gimp",
    "canva",
    "ilovepdf",
    "pdfescape",
    "sejda",
    "smallpdf",
    "pdf24",
    "foxit phantompdf",
    "nitro pro",
    "inkscape",
    "coreldraw",
    "paint.net",
    "online2pdf",
    "soda pdf",
    "pdf candy",
]


def _normalize_image_input(
    image_input: Union[str, Path, bytes, io.BytesIO, Image.Image, np.ndarray]
) -> Image.Image:
    """Convert various image input representations into a PIL RGB Image."""
    if isinstance(image_input, (str, Path)):
        return Image.open(str(image_input)).convert("RGB")
    elif isinstance(image_input, bytes):
        return Image.open(io.BytesIO(image_input)).convert("RGB")
    elif isinstance(image_input, io.BytesIO):
        image_input.seek(0)
        return Image.open(image_input).convert("RGB")
    elif isinstance(image_input, np.ndarray):
        if image_input.ndim == 2:
            return Image.fromarray(image_input).convert("RGB")
        elif image_input.ndim == 3:
            # Assume OpenCV BGR if 3 channels, convert to RGB
            if image_input.shape[2] == 3:
                rgb_arr = cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB)
                return Image.fromarray(rgb_arr)
            elif image_input.shape[2] == 4:
                rgb_arr = cv2.cvtColor(image_input, cv2.COLOR_BGRA2RGB)
                return Image.fromarray(rgb_arr)
            else:
                return Image.fromarray(image_input).convert("RGB")
    elif isinstance(image_input, Image.Image):
        return image_input.convert("RGB")

    raise ValueError(f"Unsupported image input type: {type(image_input)}")


def compute_ela(
    image_input: Union[str, Path, bytes, io.BytesIO, Image.Image, np.ndarray],
    quality: int = 90,
    scale: float = 10.0,
) -> Dict[str, Any]:
    """Compute Error Level Analysis (ELA) pixel difference matrices and anomaly score.

    ELA re-compresses the image at a known JPEG quality factor (default 90) and measures
    the absolute difference per pixel channel against the original. Authentic documents
    exhibit uniform error distribution across consistent surfaces, whereas spliced,
    digitally modified, or repasted elements exhibit stark error level discrepancies.

    Args:
        image_input: Image file path, raw bytes, PIL Image, or NumPy array.
        quality: JPEG compression quality factor for ELA resave (default: 90).
        scale: Multiplier scale to magnify difference matrix (default: 10.0).

    Returns:
        Dictionary containing:
            - anomaly_score: float (0.0 to 100.0)
            - mean_difference: float
            - max_difference: float
            - std_difference: float
            - high_error_ratio: float
            - is_suspicious: bool
            - tampering_detected: bool
            - diff_matrix: 2D numpy float array of pixel differences
            - scaled_matrix: 2D numpy uint8 array of magnified differences
            - details: metadata dictionary
    """
    orig_pil = _normalize_image_input(image_input)
    orig_np = np.asarray(orig_pil, dtype=np.int32)

    # Recompress original image to JPEG in memory
    buffer = io.BytesIO()
    orig_pil.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    recompressed_pil = Image.open(buffer).convert("RGB")
    recompressed_np = np.asarray(recompressed_pil, dtype=np.int32)

    # Compute absolute difference across color channels
    diff_channels = np.abs(orig_np - recompressed_np)
    diff_matrix = np.max(diff_channels, axis=2).astype(np.float32)

    # Compute statistics
    mean_diff = float(np.mean(diff_matrix))
    max_diff = float(np.max(diff_matrix))
    std_diff = float(np.std(diff_matrix))

    # Identify pixels with elevated compression error
    error_threshold = max(18.0, mean_diff + 2.0 * std_diff)
    high_error_pixels = int(np.sum(diff_matrix > error_threshold))
    total_pixels = max(1, diff_matrix.size)
    high_error_ratio = float(high_error_pixels / total_pixels)

    # Scaled matrix for visualization
    scaled_matrix = np.clip(diff_matrix * scale, 0, 255).astype(np.uint8)

    # Anomaly score computation (0.0 to 100.0)
    # Balanced weighting: mean error level (35%), dispersion/std (35%), outlier ratio (30%)
    mean_component = min(35.0, (mean_diff / 12.0) * 35.0)
    std_component = min(35.0, (std_diff / 10.0) * 35.0)
    outlier_component = min(30.0, (high_error_ratio / 0.12) * 30.0)
    anomaly_score = round(min(100.0, mean_component + std_component + outlier_component), 2)

    is_suspicious = bool(anomaly_score >= 45.0 or high_error_ratio >= 0.08 or max_diff >= 140.0)

    return {
        "anomaly_score": anomaly_score,
        "mean_difference": round(mean_diff, 4),
        "max_difference": round(max_diff, 4),
        "std_difference": round(std_diff, 4),
        "high_error_ratio": round(high_error_ratio, 4),
        "is_suspicious": is_suspicious,
        "tampering_detected": is_suspicious,
        "diff_matrix": diff_matrix,
        "scaled_matrix": scaled_matrix,
        "details": {
            "quality": quality,
            "scale": scale,
            "width": orig_pil.width,
            "height": orig_pil.height,
            "high_error_threshold": round(error_threshold, 2),
        },
    }


def detect_blur_and_flattening(
    image_input: Union[str, Path, bytes, io.BytesIO, Image.Image, np.ndarray],
    blur_threshold: float = 100.0,
    tile_size: int = 64,
) -> Dict[str, Any]:
    """Detect image blur and localized text flattening / smoothing using OpenCV cv2.Laplacian.

    Uses cv2.Laplacian to evaluate second-order spatial derivatives:
    - Low global Laplacian variance (< blur_threshold) flags blurred, unfocused, or
      intentionally downscaled documents.
    - Localized tile analysis detects artificially smoothed or flattened regions where
      original text was rubbed out, erased, or covered by a solid/gradient brush tool.

    Args:
        image_input: Image file path, raw bytes, PIL Image, or NumPy array.
        blur_threshold: Threshold below which global image is classified as blurred (default: 100.0).
        tile_size: Tile dimension in pixels for localized smoothing analysis (default: 64).

    Returns:
        Dictionary containing:
            - global_laplacian_variance: float
            - blur_score: float (0.0 to 100.0)
            - is_blurred: bool
            - tampering_detected: bool
            - smoothed_regions_count: int
            - suspicious_regions: List of Dict[str, Any] with bounding boxes and variances
    """
    pil_img = _normalize_image_input(image_input)
    gray = np.array(pil_img.convert("L"))

    # Compute global Laplacian variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    global_variance = float(laplacian.var())

    h, w = gray.shape
    suspicious_regions: List[Dict[str, Any]] = []

    # Slide over tiles to evaluate local variance and identify flattened/smoothed areas
    for y in range(0, h - tile_size + 1, tile_size):
        for x in range(0, w - tile_size + 1, tile_size):
            tile = gray[y : y + tile_size, x : x + tile_size]
            tile_mean = float(tile.mean())
            tile_std = float(tile.std())
            tile_lap = cv2.Laplacian(tile, cv2.CV_64F)
            tile_var = float(tile_lap.var())

            # A completely clean white paper margin has tile_mean > 250 and tile_std < 2.0.
            # Suspicious smoothed / edited regions occur when:
            # 1. Tile has non-blank tone (tile_mean between 30 and 242) but unnatural near-zero variance (< 4.0)
            #    indicating an erased or brush-flattened text zone.
            # 2. Tile has moderate stroke energy / text edges (tile_std between 5.0 and 35.0),
            #    but Laplacian variance is suppressed (< 18.0) indicating localized Gaussian blur or smoothing.
            is_flattened_patch = (30.0 < tile_mean < 242.0) and (tile_std < 2.5) and (tile_var < 5.0)
            is_localized_blur = (50.0 < tile_mean < 235.0) and (6.0 < tile_std < 40.0) and (tile_var < 20.0)

            if is_flattened_patch:
                suspicious_regions.append(
                    {
                        "x": x,
                        "y": y,
                        "width": tile_size,
                        "height": tile_size,
                        "variance": round(tile_var, 2),
                        "label": "flattened_region",
                    }
                )
            elif is_localized_blur:
                suspicious_regions.append(
                    {
                        "x": x,
                        "y": y,
                        "width": tile_size,
                        "height": tile_size,
                        "variance": round(tile_var, 2),
                        "label": "smoothed_text_region",
                    }
                )

    is_globally_blurred = bool(global_variance < blur_threshold)
    tampering_detected = bool(len(suspicious_regions) > 0)

    # Compute normalized blur and smoothing risk score (0.0 to 100.0)
    # Global blur risk:
    if global_variance < blur_threshold:
        global_blur_score = max(0.0, min(100.0, (blur_threshold - global_variance) / blur_threshold * 80.0))
    else:
        global_blur_score = 0.0

    # Localized smoothing risk (up to 20 points per flagged region, capped at 60)
    smoothing_risk = min(60.0, len(suspicious_regions) * 15.0)
    blur_score = round(min(100.0, max(global_blur_score, smoothing_risk) + (0.2 * global_blur_score if smoothing_risk > 0 else 0.0)), 2)

    return {
        "global_laplacian_variance": round(global_variance, 4),
        "blur_score": blur_score,
        "is_blurred": is_globally_blurred,
        "tampering_detected": tampering_detected,
        "smoothed_regions_count": len(suspicious_regions),
        "suspicious_regions": suspicious_regions,
    }


def _parse_pdf_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parse PDF date string format (e.g. 'D:20240415143000+05'30'' or ISO format)."""
    if not date_str:
        return None

    cleaned = str(date_str).strip()
    if cleaned.startswith("D:"):
        cleaned = cleaned[2:]

    # Extract digits YYYYMMDDHHmmSS
    match = re.match(r"^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?", cleaned)
    if match:
        year = int(match.group(1))
        month = int(match.group(2)) if match.group(2) else 1
        day = int(match.group(3)) if match.group(3) else 1
        hour = int(match.group(4)) if match.group(4) else 0
        minute = int(match.group(5)) if match.group(5) else 0
        second = int(match.group(6)) if match.group(6) else 0
        try:
            return datetime(year, month, day, hour, minute, second, tzinfo=timezone.utc)
        except ValueError:
            pass

    # Fallback to ISO format parsing
    try:
        return datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
    except Exception:
        return None


def extract_pdf_metadata(
    pdf_input: Union[str, Path, bytes, io.BytesIO]
) -> Dict[str, Any]:
    """Inspect PDF timestamps, producer signatures, and revision history using PyMuPDF and pdfminer.six.

    Cross-analyzes PyMuPDF document metadata and low-level pdfminer.six XRef structures
    to detect:
    - Incremental revisions (appended modifications).
    - Discrepancies between CreationDate and ModDate.
    - Suspicious PDF Producer and Creator software tools (e.g. Photoshop, GIMP, Canva, iLovePDF).
    - Document repairs or structural damage.

    Args:
        pdf_input: PDF file path, raw bytes, or BytesIO stream.

    Returns:
        Dictionary containing:
            - producer: Optional[str]
            - creator: Optional[str]
            - creation_date: Optional[str]
            - modification_date: Optional[str]
            - timestamp_discrepancy: bool
            - time_difference_seconds: Optional[float]
            - revision_count: int
            - is_modified: bool
            - suspicious_producer: bool
            - is_repaired: bool
            - metadata_risk_score: float (0.0 to 100.0)
            - anomalies: List[str]
    """
    # Prepare bytes and path
    pdf_bytes: bytes
    if isinstance(pdf_input, (str, Path)):
        with open(str(pdf_input), "rb") as f:
            pdf_bytes = f.read()
    elif isinstance(pdf_input, bytes):
        pdf_bytes = pdf_input
    elif isinstance(pdf_input, io.BytesIO):
        pdf_input.seek(0)
        pdf_bytes = pdf_input.read()
    else:
        raise ValueError(f"Unsupported PDF input type: {type(pdf_input)}")

    # 1. PyMuPDF analysis
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    meta = doc.metadata or {}
    producer = meta.get("producer") or ""
    creator = meta.get("creator") or ""
    creation_date = meta.get("creationDate") or ""
    mod_date = meta.get("modDate") or ""
    is_repaired = bool(doc.is_repaired)
    doc.close()

    # 2. pdfminer.six structural analysis (incremental revision / XRef count)
    revision_count = 1
    if PDFParser is not None and PDFDocument is not None:
        try:
            stream = io.BytesIO(pdf_bytes)
            parser = PDFParser(stream)
            pdf_doc = PDFDocument(parser)
            if hasattr(pdf_doc, "xrefs") and pdf_doc.xrefs:
                revision_count = max(1, len(pdf_doc.xrefs))
        except Exception:
            # Fallback to single revision if parser encounters encrypted or unusual stream
            revision_count = 1

    # 3. Timestamp analysis
    anomalies: List[str] = []
    created_dt = _parse_pdf_date(creation_date)
    mod_dt = _parse_pdf_date(mod_date)
    time_diff_sec: Optional[float] = None
    timestamp_discrepancy = False

    if created_dt and mod_dt:
        time_diff_sec = (mod_dt - created_dt).total_seconds()
        # ModDate significantly later than CreationDate (threshold: 300 seconds / 5 mins)
        if time_diff_sec > 300.0:
            timestamp_discrepancy = True
            hours_diff = round(time_diff_sec / 3600.0, 1)
            anomalies.append(
                f"Timestamp discrepancy detected: Document modified {hours_diff} hours after creation."
            )
        elif time_diff_sec < -60.0:
            timestamp_discrepancy = True
            anomalies.append("Anomalous timestamp: Modification date precedes Creation date.")
    elif mod_date and not creation_date:
        timestamp_discrepancy = True
        anomalies.append("Modification date exists but Creation date is missing.")

    # 4. Suspicious producer signature inspection
    combined_sig = f"{producer} {creator}".lower()
    suspicious_producer = False
    for susp_tool in SUSPICIOUS_PRODUCERS:
        if susp_tool in combined_sig:
            suspicious_producer = True
            anomalies.append(f"Suspicious Producer/Creator software detected: '{susp_tool}'.")
            break

    # 5. Revision history inspection
    is_modified = bool(revision_count > 1 or timestamp_discrepancy)
    if revision_count > 1:
        anomalies.append(
            f"Incremental revision detected: PDF contains {revision_count} revision/XRef update sections."
        )

    if is_repaired:
        anomalies.append("Document structure was flagged as damaged or repaired.")

    # 6. Metadata risk score computation (0.0 to 100.0)
    risk_score = 0.0
    if suspicious_producer:
        risk_score += 50.0
    if revision_count > 1:
        risk_score += min(35.0, 20.0 + (revision_count - 2) * 10.0)
    if timestamp_discrepancy:
        risk_score += 25.0
    if is_repaired:
        risk_score += 15.0
    if not producer and not creator:
        risk_score += 10.0
        anomalies.append("Missing document producer/creator metadata.")

    metadata_risk_score = round(min(100.0, risk_score), 2)

    return {
        "producer": producer if producer else None,
        "creator": creator if creator else None,
        "creation_date": creation_date if creation_date else None,
        "modification_date": mod_date if mod_date else None,
        "timestamp_discrepancy": timestamp_discrepancy,
        "time_difference_seconds": time_diff_sec,
        "revision_count": revision_count,
        "is_modified": is_modified,
        "suspicious_producer": suspicious_producer,
        "is_repaired": is_repaired,
        "metadata_risk_score": metadata_risk_score,
        "anomalies": anomalies,
    }


def analyze_document_forensics(
    file_input: Union[str, Path, bytes, io.BytesIO],
    filename: str = "",
    page_num: int = 0,
) -> Dict[str, Any]:
    """Execute complete Layer 2 visual and structural forensics inspection.

    Supports both PDF documents and standard image formats (.png, .jpg, .jpeg, .tiff, etc.).
    Computes:
    - Error Level Analysis (ELA) anomaly score.
    - OpenCV Laplacian blur and text flattening analysis.
    - PyMuPDF and pdfminer.six metadata, producer signature, and revision history.
    - Consolidated composite tampering risk score and categorical risk level.

    Args:
        file_input: Path, bytes, or buffer of uploaded document.
        filename: Original filename of the document.
        page_num: Zero-indexed page number to render for visual inspection (PDF only).

    Returns:
        Structured forensics payload conforming to ForensicsResponse schema.
    """
    # Read bytes if needed
    raw_bytes: bytes
    if isinstance(file_input, (str, Path)):
        if not filename:
            filename = os.path.basename(str(file_input))
        with open(str(file_input), "rb") as f:
            raw_bytes = f.read()
    elif isinstance(file_input, bytes):
        raw_bytes = file_input
    elif isinstance(file_input, io.BytesIO):
        file_input.seek(0)
        raw_bytes = file_input.read()
    else:
        raise ValueError(f"Unsupported file input: {type(file_input)}")

    is_pdf = filename.lower().endswith(".pdf") or raw_bytes.startswith(b"%PDF")
    file_type = "pdf" if is_pdf else (filename.split(".")[-1].lower() if "." in filename else "image")

    flags: List[str] = []
    pdf_meta_result: Optional[Dict[str, Any]] = None
    rendered_image: Image.Image

    if is_pdf:
        # Run PDF metadata and revision analysis
        pdf_meta_result = extract_pdf_metadata(raw_bytes)
        for anomaly in pdf_meta_result["anomalies"]:
            flags.append(f"[Metadata] {anomaly}")

        # Render target PDF page to RGB pixmap
        doc = fitz.open(stream=raw_bytes, filetype="pdf")
        if page_num < 0 or page_num >= doc.page_count:
            total_pages = doc.page_count
            doc.close()
            raise IndexError(f"Page number {page_num} out of bounds (total pages: {total_pages})")

        page = doc[page_num]
        # Render at 150 DPI (zoom 150/72 ~ 2.083) for visual forensics fidelity
        zoom = 150.0 / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        rendered_image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        doc.close()
    else:
        # Direct image input
        rendered_image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")

    # Run visual forensics
    ela_res = compute_ela(rendered_image)
    if ela_res["is_suspicious"]:
        flags.append(
            f"[ELA] Elevated compression anomaly detected (score: {ela_res['anomaly_score']}, high error ratio: {ela_res['high_error_ratio']})."
        )

    blur_res = detect_blur_and_flattening(rendered_image)
    if blur_res["is_blurred"]:
        flags.append(
            f"[Blur] Document exhibits excessive optical blur (Laplacian variance: {blur_res['global_laplacian_variance']})."
        )
    if blur_res["tampering_detected"]:
        flags.append(
            f"[Smoothing] Detected {blur_res['smoothed_regions_count']} smoothed or flattened region(s) indicating potential text erasure."
        )

    # Compute composite tampering score (0.0 to 100.0)
    if is_pdf and pdf_meta_result:
        # Weighted combination: ELA (40%), Metadata/Revision (35%), Blur/Smoothing (25%)
        comp_score = (
            0.40 * ela_res["anomaly_score"]
            + 0.35 * pdf_meta_result["metadata_risk_score"]
            + 0.25 * blur_res["blur_score"]
        )
    else:
        # Image combination: ELA (60%), Blur/Smoothing (40%)
        comp_score = 0.60 * ela_res["anomaly_score"] + 0.40 * blur_res["blur_score"]

    composite_score = round(min(100.0, max(0.0, comp_score)), 2)

    # Determine risk level category and overall tampering verdict
    if composite_score >= 50.0 or (pdf_meta_result and pdf_meta_result["suspicious_producer"]):
        risk_level = "HIGH"
        is_tampered = True
    elif composite_score >= 30.0 or ela_res["is_suspicious"] or blur_res["tampering_detected"]:
        risk_level = "MEDIUM"
        is_tampered = True
    else:
        risk_level = "LOW"
        is_tampered = False

    # Package clean JSON-serializable score breakdown
    score_breakdown: Dict[str, Any] = {
        "ela": {
            "anomaly_score": ela_res["anomaly_score"],
            "mean_difference": ela_res["mean_difference"],
            "max_difference": ela_res["max_difference"],
            "std_difference": ela_res["std_difference"],
            "high_error_ratio": ela_res["high_error_ratio"],
            "is_suspicious": ela_res["is_suspicious"],
            "tampering_detected": ela_res["tampering_detected"],
            "details": ela_res["details"],
        },
        "blur_and_smoothing": {
            "global_laplacian_variance": blur_res["global_laplacian_variance"],
            "blur_score": blur_res["blur_score"],
            "is_blurred": blur_res["is_blurred"],
            "tampering_detected": blur_res["tampering_detected"],
            "smoothed_regions_count": blur_res["smoothed_regions_count"],
            "suspicious_regions": blur_res["suspicious_regions"],
        },
        "pdf_metadata": pdf_meta_result,
    }

    return {
        "success": True,
        "filename": filename or "document",
        "file_type": file_type,
        "page_analyzed": page_num if is_pdf else 0,
        "composite_score": composite_score,
        "risk_level": risk_level,
        "is_tampered": is_tampered,
        "score_breakdown": score_breakdown,
        "flags": flags,
    }
