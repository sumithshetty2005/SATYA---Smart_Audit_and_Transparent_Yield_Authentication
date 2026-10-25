"""Layer 3: Authoritative Source Verification Engine.

Implements authoritative provenance and cryptographic verification for AICTE documents:
1. 2D QR Code decoding and bounding box localization using native OpenCV (cv2.QRCodeDetector) and PyMuPDF.
2. PKI digital signature and X.509 certificate validation using pyhanko (PdfFileReader, validate_pdf_signature).
3. Post-signing document integrity and modification detection.
4. Structured cryptographic verification receipt generation.
"""

from __future__ import annotations

import asyncio
import concurrent.futures
import hashlib
import io
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from urllib.parse import parse_qs, urlparse

import cv2
import fitz  # PyMuPDF
import numpy as np
from PIL import Image
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.validation import validate_pdf_signature

# Authoritative government and council web domains
AUTHORITATIVE_DOMAINS = [
    "aicte-india.org",
    "facilities.aicte-india.org",
    "gov.in",
    "nic.in",
    "education.gov.in",
    "digilocker.gov.in",
    "india.gov.in",
]


def _read_pdf_bytes(pdf_input: Union[str, Path, bytes, io.BytesIO]) -> bytes:
    """Normalize PDF input into raw bytes."""
    if isinstance(pdf_input, (str, Path)):
        with open(str(pdf_input), "rb") as f:
            return f.read()
    elif isinstance(pdf_input, bytes):
        return pdf_input
    elif isinstance(pdf_input, io.BytesIO):
        pdf_input.seek(0)
        return pdf_input.read()
    else:
        raise ValueError(f"Unsupported PDF input type: {type(pdf_input)}")


def _check_authoritative_domain(url_str: str) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Determine whether a decoded URL originates from an authoritative portal."""
    try:
        parsed = urlparse(url_str.strip())
        domain = parsed.netloc.lower()
        if ":" in domain:
            domain = domain.split(":")[0]

        is_auth = any(domain == auth or domain.endswith(f".{auth}") for auth in AUTHORITATIVE_DOMAINS)
        query_params = {k: v[0] if len(v) == 1 else v for k, v in parse_qs(parsed.query).items()}
        return is_auth, domain if domain else None, query_params
    except Exception:
        return False, None, {}


def _extract_cert_details(cert: Any) -> Optional[Dict[str, Any]]:
    """Extract human-readable attributes from an X.509 digital certificate."""
    if not cert:
        return None

    try:
        subject = cert.subject
        issuer = cert.issuer

        # Parse Common Name, Organization, Country
        def get_attr(name_obj: Any, key_name: str) -> str:
            try:
                for rdn in name_obj.chosen:
                    for attr in rdn:
                        if attr["type"].native == key_name:
                            return str(attr["value"].native)
            except Exception:
                pass
            return ""

        subj_cn = get_attr(subject, "common_name") or subject.human_friendly
        subj_org = get_attr(subject, "organization_name")
        subj_country = get_attr(subject, "country_name")

        iss_cn = get_attr(issuer, "common_name") or issuer.human_friendly
        iss_org = get_attr(issuer, "organization_name")

        serial = hex(cert.serial_number) if hasattr(cert, "serial_number") else ""

        valid_from_dt = getattr(cert, "not_valid_before", None)
        valid_until_dt = getattr(cert, "not_valid_after", None)

        now_utc = datetime.now(timezone.utc)
        is_expired = False
        if valid_until_dt and valid_until_dt < now_utc:
            is_expired = True

        is_self_signed = getattr(cert, "self_signed", False) or (subject == issuer)

        return {
            "subject_cn": subj_cn,
            "subject_org": subj_org,
            "subject_country": subj_country,
            "issuer_cn": iss_cn,
            "issuer_org": iss_org,
            "serial_number": serial,
            "valid_from": valid_from_dt.isoformat() if valid_from_dt else None,
            "valid_until": valid_until_dt.isoformat() if valid_until_dt else None,
            "is_expired": is_expired,
            "is_self_signed": bool(is_self_signed),
            "raw_subject": subject.human_friendly if hasattr(subject, "human_friendly") else str(subject),
            "raw_issuer": issuer.human_friendly if hasattr(issuer, "human_friendly") else str(issuer),
        }
    except Exception:
        return None


class LayerThreeSourceVerifier:
    """Authoritative source verification engine leveraging native OpenCV and PyHanko."""

    def __init__(self) -> None:
        """Initialize OpenCV QRCodeDetector singleton."""
        self.qr_detector = cv2.QRCodeDetector()

    def decode_qr_codes(
        self,
        pdf_path: Optional[Union[str, Path, bytes, io.BytesIO]] = None,
        target_page: Optional[int] = None,
        pdf_input: Optional[Union[str, Path, bytes, io.BytesIO]] = None,
    ) -> List[Dict[str, Any]]:
        """Scan PDF page renders for embedded 2D QR codes using a 3-pass OpenCV pipeline.

        1. DPI Adjustment: Set page rendering resolution to 200 DPI (page.get_pixmap(dpi=200)).
        2. Grayscale Conversion: Convert rendered PIL image to OpenCV BGR array (cv2.cvtColor),
           then to grayscale (cv2.COLOR_BGR2GRAY).
        3. 3-Tier Detection Fallback:
           - Pass 1: detectAndDecodeMulti(gray) directly on grayscale image.
           - Pass 2 (Binarization): If Pass 1 returns no valid text, apply Otsu thresholding
             (_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU))
             and run detectAndDecodeMulti(thresh).
           - Pass 3 (Single-QR Fallback): If Pass 2 returns no valid text, run detectAndDecode(gray).
        4. Output Structuring: Filter empty text payloads and return structured list containing
           page, type ("QRCODE"), raw_payload, and bounding_box.

        Args:
            pdf_path: PDF file path, raw bytes, or BytesIO buffer.
            target_page: Zero-indexed target page. If None, scans all document pages.
            pdf_input: Optional alias for pdf_path.

        Returns:
            List of structured QR code records.
        """
        target = pdf_path if pdf_path is not None else pdf_input
        if target is None:
            raise ValueError("pdf_path or pdf_input must be provided.")

        # Open PDF via PyMuPDF
        if isinstance(target, (str, Path)) and os.path.exists(str(target)):
            doc = fitz.open(str(target))
        else:
            pdf_bytes = _read_pdf_bytes(target)
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        results: List[Dict[str, Any]] = []
        pages_to_scan = range(doc.page_count) if target_page is None else [target_page]

        for page_idx in pages_to_scan:
            if page_idx < 0 or page_idx >= doc.page_count:
                continue

            page = doc[page_idx]

            # 1. DPI Adjustment: Set the page rendering resolution to 200 DPI
            pix = page.get_pixmap(dpi=200)
            if pix.width == 0 or pix.height == 0:
                continue

            # 2. Grayscale Conversion: Convert rendered PIL image to OpenCV BGR array, then to grayscale
            pil_image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
            img_bgr = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

            # 3. 3-Tier Detection Fallback
            detected_entries: List[Tuple[str, np.ndarray]] = []

            # Pass 1: Run self.qr_detector.detectAndDecodeMulti(gray) directly on the grayscale image
            retval1, decoded_info1, points1, _ = self.qr_detector.detectAndDecodeMulti(gray)
            if retval1 and decoded_info1 is not None and points1 is not None:
                for idx, text in enumerate(decoded_info1):
                    if text and text.strip():
                        pts = points1[idx] if len(points1) > idx else points1[0]
                        detected_entries.append((text.strip(), pts))

            # Pass 2 (Binarization): If Pass 1 returns no valid text, apply Otsu thresholding and run detectAndDecodeMulti(thresh)
            if not detected_entries:
                _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                retval2, decoded_info2, points2, _ = self.qr_detector.detectAndDecodeMulti(thresh)
                if retval2 and decoded_info2 is not None and points2 is not None:
                    for idx, text in enumerate(decoded_info2):
                        if text and text.strip():
                            pts = points2[idx] if len(points2) > idx else points2[0]
                            detected_entries.append((text.strip(), pts))

            # Pass 3 (Single-QR Fallback): If Pass 2 returns no valid text, run self.qr_detector.detectAndDecode(gray)
            if not detected_entries:
                single_val, single_pts, _ = self.qr_detector.detectAndDecode(gray)
                if single_val and single_val.strip() and single_pts is not None and len(single_pts) > 0:
                    pts = single_pts[0] if len(single_pts.shape) == 3 else single_pts
                    detected_entries.append((single_val.strip(), pts))

            # 4. Output Structuring: Filter out empty text payloads and return structured list
            for text_payload, pts in detected_entries:
                if not text_payload or not text_payload.strip():
                    continue

                if pts is not None and len(pts) > 0:
                    xs = [int(p[0]) for p in pts]
                    ys = [int(p[1]) for p in pts]
                    left = min(xs)
                    top = min(ys)
                    width = max(xs) - left
                    height = max(ys) - top
                    polygon = [[int(p[0]), int(p[1])] for p in pts]
                else:
                    left = top = width = height = 0
                    polygon = []

                is_auth, domain, params = _check_authoritative_domain(text_payload)

                results.append(
                    {
                        "page": page_idx,
                        "type": "QRCODE",
                        "raw_payload": text_payload,
                        "payload": text_payload,
                        "code_type": "QRCODE",
                        "bounding_box": {
                            "left": left,
                            "top": top,
                            "width": width,
                            "height": height,
                        },
                        "polygon": polygon,
                        "is_authoritative": is_auth,
                        "domain": domain,
                        "parsed_parameters": params,
                    }
                )

        doc.close()
        return results

    def verify_pki_signature(
        self,
        pdf_path: Union[str, Path, bytes, io.BytesIO],
    ) -> Dict[str, Any]:
        """Parse embedded X.509 digital certificates and verify hash integrity using pyhanko.

        Evaluates:
        - Signature presence and field count.
        - Cryptographic digest integrity across the signed byte range (status.intact).
        - Signature syntax and validity (status.valid).
        - Post-signing document modifications or unauthorized appends.
        - Embedded X.509 certificate attributes and issuer chains.

        Args:
            pdf_path: PDF file path, raw bytes, or BytesIO buffer.

        Returns:
            Structured dictionary matching PKIVerificationResult schema.
        """
        pdf_bytes = _read_pdf_bytes(pdf_path)
        stream = io.BytesIO(pdf_bytes)

        try:
            reader = PdfFileReader(stream)
            embedded_sigs = list(reader.embedded_signatures)
        except Exception as exc:
            return {
                "signatures_found": 0,
                "all_intact": False,
                "all_valid": False,
                "tampered_post_signing": False,
                "signatures": [],
                "error": f"Failed to parse PDF signatures: {str(exc)}",
            }

        if not embedded_sigs:
            return {
                "signatures_found": 0,
                "all_intact": False,
                "all_valid": False,
                "tampered_post_signing": False,
                "signatures": [],
            }

        sig_records: List[Dict[str, Any]] = []
        all_intact = True
        all_valid = True
        tampered_post_signing = False

        for embedded_sig in embedded_sigs:
            field_name = (
                getattr(embedded_sig, "field_name", None)
                or getattr(embedded_sig, "sig_field", None)
                or "Signature"
            )
            try:
                # If running inside an asyncio event loop (e.g. FastAPI async endpoint),
                # pyhanko's internal asyncio.run() will raise a RuntimeError unless offloaded to a thread.
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None

                if loop and loop.is_running():
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                        val_status = pool.submit(validate_pdf_signature, embedded_sig).result()
                else:
                    val_status = validate_pdf_signature(embedded_sig)

                intact = bool(val_status.intact)
                valid = bool(val_status.valid)

                # Check coverage and post-signing alterations
                coverage_name = (
                    val_status.coverage.name
                    if hasattr(val_status.coverage, "name")
                    else str(val_status.coverage)
                )

                # Post-signing modification flag:
                # 1. Cryptographic hash failure (intact is False)
                # 2. Byte coverage does not encompass file and non-DocMDP updates exist
                mod_level = getattr(val_status, "modification_level", None)
                mod_str = str(mod_level) if mod_level else ""
                has_mod = bool(
                    not intact
                    or (coverage_name != "ENTIRE_FILE" and "NONE" not in mod_str and mod_level is not None)
                )

                if not intact or has_mod:
                    tampered_post_signing = True
                if not intact:
                    all_intact = False
                if not valid:
                    all_valid = False

                cert_info = _extract_cert_details(val_status.signing_cert)

                # Signing time claim
                signing_time_str: Optional[str] = None
                if hasattr(val_status, "signer_reported_dt") and val_status.signer_reported_dt:
                    signing_time_str = val_status.signer_reported_dt.isoformat()

                status_summary = (
                    "Cryptographically intact and valid"
                    if (intact and valid and not has_mod)
                    else (
                        "TAMPERED: Digest mismatch or post-signing file modification detected"
                        if (not intact or has_mod)
                        else "Signature validation error"
                    )
                )

                sig_records.append(
                    {
                        "field_name": field_name,
                        "intact": intact,
                        "valid": valid,
                        "post_signing_modification": has_mod,
                        "coverage": coverage_name,
                        "signing_time": signing_time_str,
                        "certificate": cert_info,
                        "status_summary": status_summary,
                    }
                )

            except Exception as sig_err:
                all_intact = False
                all_valid = False
                tampered_post_signing = True
                sig_records.append(
                    {
                        "field_name": field_name,
                        "intact": False,
                        "valid": False,
                        "post_signing_modification": True,
                        "coverage": "UNKNOWN",
                        "signing_time": None,
                        "certificate": None,
                        "status_summary": f"Validation exception: {str(sig_err)}",
                    }
                )

        return {
            "signatures_found": len(sig_records),
            "all_intact": all_intact,
            "all_valid": all_valid,
            "tampered_post_signing": tampered_post_signing,
            "signatures": sig_records,
        }

    def verify_authoritative_source(
        self,
        pdf_path: Optional[Union[str, Path, bytes, io.BytesIO]] = None,
        filename: str = "",
        pdf_input: Optional[Union[str, Path, bytes, io.BytesIO]] = None,
    ) -> Dict[str, Any]:
        """Execute complete Layer 3 authoritative source verification.

        Executes:
        1. Cryptographic SHA-256 hash calculation of the document.
        2. PKI digital signature and X.509 certificate verification via pyhanko.
        3. 2D QR code detection and authoritative domain matching via native OpenCV.
        4. Consolidated trust score and formal verification receipt generation.

        Args:
            pdf_path: PDF file path, raw bytes, or BytesIO buffer.
            filename: Original filename of the document.
            pdf_input: Alias for pdf_path.

        Returns:
            Structured verification receipt matching SourceVerificationReceipt schema.
        """
        target = pdf_path if pdf_path is not None else pdf_input
        if target is None:
            raise ValueError("pdf_path or pdf_input must be provided.")
        pdf_bytes = _read_pdf_bytes(target)
        if not filename:
            if isinstance(target, (str, Path)):
                filename = os.path.basename(str(target))
            else:
                filename = "document.pdf"

        # Compute SHA-256 hash of entire file
        doc_sha256 = hashlib.sha256(pdf_bytes).hexdigest()
        timestamp_now = datetime.now(timezone.utc).isoformat()
        receipt_id = f"VR-{uuid.uuid4().hex[:12].upper()}"

        flags: List[str] = []

        # 1. Run PKI digital signature verification
        pki_res = self.verify_pki_signature(pdf_bytes)
        sigs_found = pki_res["signatures_found"]
        tampered_post_signing = pki_res["tampered_post_signing"]
        all_intact = pki_res["all_intact"]
        all_valid = pki_res["all_valid"]

        if sigs_found > 0:
            if tampered_post_signing:
                flags.append("[PKI] Document was modified or corrupted after digital signing.")
            elif all_intact and all_valid:
                sig_cn = (
                    pki_res["signatures"][0]["certificate"]["subject_cn"]
                    if pki_res["signatures"][0].get("certificate")
                    else "Authorized Signer"
                )
                flags.append(f"[PKI] Verified digital signature issued to: {sig_cn}")
        else:
            flags.append("[PKI] No embedded X.509 digital signature found in document.")

        # 2. Run 2D QR code verification with native OpenCV
        qr_records = self.decode_qr_codes(pdf_bytes)
        qr_found = len(qr_records)
        authoritative_qr_matched = any(r["is_authoritative"] for r in qr_records)

        if qr_found > 0:
            if authoritative_qr_matched:
                auth_record = next(r for r in qr_records if r["is_authoritative"])
                flags.append(f"[QR] Authoritative portal verification link confirmed: {auth_record['domain']}")
            else:
                flags.append("[QR] 2D QR code detected but does not resolve to an authoritative government portal.")
        else:
            flags.append("[QR] No 2D QR verification code detected on document pages.")

        # 3. Compute trust score (0.0 to 100.0) and overall status
        trust_score = 0.0

        if tampered_post_signing:
            overall_status = "TAMPERED_POST_SIGNING"
            trust_score = 0.0
        elif sigs_found > 0 and all_intact and all_valid:
            # Base PKI points: 65
            trust_score += 65.0
            # Authoritative QR code adds 25 points
            if authoritative_qr_matched:
                trust_score += 25.0
            elif qr_found > 0:
                trust_score += 10.0
            # Hash integrity points
            trust_score += 10.0
            overall_status = "AUTHENTIC"
        elif authoritative_qr_matched:
            # Legitimate QR code link to AICTE/gov server without digital signature
            trust_score = 65.0
            overall_status = "AUTHENTIC"
        elif qr_found > 0 and not authoritative_qr_matched:
            trust_score = 30.0
            overall_status = "SUSPICIOUS"
        else:
            trust_score = 15.0
            overall_status = "UNVERIFIED"

        trust_score = round(min(100.0, max(0.0, trust_score)), 2)

        return {
            "success": True,
            "document_name": filename,
            "document_sha256": doc_sha256,
            "verification_timestamp": timestamp_now,
            "overall_status": overall_status,
            "trust_score": trust_score,
            "pki_verification": pki_res,
            "qr_verification": {
                "qr_codes_found": qr_found,
                "authoritative_url_matched": authoritative_qr_matched,
                "extracted_records": qr_records,
            },
            "flags": flags,
            "receipt_id": receipt_id,
        }


# Singleton holder for performance optimization
_source_verifier_instance: Optional[LayerThreeSourceVerifier] = None


def get_source_verifier() -> LayerThreeSourceVerifier:
    """Retrieve or lazily initialize LayerThreeSourceVerifier singleton."""
    global _source_verifier_instance
    if _source_verifier_instance is None:
        _source_verifier_instance = LayerThreeSourceVerifier()
    return _source_verifier_instance


def decode_qr_codes(
    pdf_path: Optional[Union[str, Path, bytes, io.BytesIO]] = None,
    target_page: Optional[int] = None,
    pdf_input: Optional[Union[str, Path, bytes, io.BytesIO]] = None,
) -> List[Dict[str, Any]]:
    """Scan PDF page renders for embedded 2D QR codes using a 3-pass OpenCV pipeline."""
    return get_source_verifier().decode_qr_codes(
        pdf_path=pdf_path, target_page=target_page, pdf_input=pdf_input
    )


def verify_pki_signature(
    pdf_path: Union[str, Path, bytes, io.BytesIO],
) -> Dict[str, Any]:
    """Parse embedded X.509 digital certificates and verify hash integrity using pyhanko."""
    return get_source_verifier().verify_pki_signature(pdf_path)


def verify_authoritative_source(
    pdf_path: Optional[Union[str, Path, bytes, io.BytesIO]] = None,
    filename: str = "",
    pdf_input: Optional[Union[str, Path, bytes, io.BytesIO]] = None,
) -> Dict[str, Any]:
    """Execute complete Layer 3 authoritative source verification."""
    return get_source_verifier().verify_authoritative_source(
        pdf_path=pdf_path, filename=filename, pdf_input=pdf_input
    )
