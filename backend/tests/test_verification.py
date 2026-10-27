"""Unit tests for Layer 3 Authoritative Source Verification Engine (native OpenCV QR Code & PKI Digital Signatures)."""

import datetime
import io
import os
import sys
import tempfile
from pathlib import Path

# Ensure root and backend are on sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import cv2
import fitz
import pytest
import qrcode
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from fastapi.testclient import TestClient
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign.fields import SigFieldSpec, append_signature_field
from pyhanko.sign.signers import PdfSignatureMetadata, SimpleSigner, sign_pdf

from app.schemas.payload import SourceVerificationReceipt
from app.verification.source_verifier import (
    LayerThreeSourceVerifier,
    decode_qr_codes,
    verify_authoritative_source,
    verify_pki_signature,
)
from backend.main import app

client = TestClient(app)


def _generate_test_cert_and_key():
    """Generate in-memory RSA key and X.509 self-signed certificate."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name(
        [
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "All India Council for Technical Education"),
            x509.NameAttribute(NameOID.COMMON_NAME, "AICTE Digital Verification Sub-CA"),
        ]
    )
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(123456789)
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365))
        .sign(key, hashes.SHA256())
    )
    return key, cert


def _create_sample_pdf(with_qr_payload: str = "") -> bytes:
    """Create a sample PDF document optionally embedding a 2D QR code."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 50), "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", fontsize=14)
    page.insert_text((50, 80), "Extension of Approval (EoA) Verification Document", fontsize=11)
    page.insert_text((50, 110), "Permanent Institute ID: 1-4567891230", fontsize=10)

    if with_qr_payload:
        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(with_qr_payload)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")

        qr_buf = io.BytesIO()
        qr_img.save(qr_buf, format="PNG")
        page.insert_image(fitz.Rect(350, 50, 550, 250), stream=qr_buf.getvalue())

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _sign_pdf_document(pdf_bytes: bytes) -> bytes:
    """Sign PDF document using pyhanko and an ephemeral test X.509 certificate."""
    key, cert = _generate_test_cert_and_key()

    with tempfile.NamedTemporaryFile(suffix=".pem", delete=False) as kf, tempfile.NamedTemporaryFile(
        suffix=".pem", delete=False
    ) as cf:
        kf.write(
            key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
        )
        cf.write(cert.public_bytes(serialization.Encoding.PEM))
        kpath, cpath = kf.name, cf.name

    try:
        signer = SimpleSigner.load(kpath, cpath)
        out = io.BytesIO()
        w = IncrementalPdfFileWriter(io.BytesIO(pdf_bytes))
        append_signature_field(w, sig_field_spec=SigFieldSpec(sig_field_name="AICTE_Signature"))
        meta = PdfSignatureMetadata(field_name="AICTE_Signature")
        sign_pdf(w, meta, signer=signer, output=out)
        return out.getvalue()
    finally:
        if os.path.exists(kpath):
            os.remove(kpath)
        if os.path.exists(cpath):
            os.remove(cpath)


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------


def test_layer_three_source_verifier_class():
    """Verify LayerThreeSourceVerifier class initializes OpenCV QRCodeDetector."""
    verifier = LayerThreeSourceVerifier()
    assert hasattr(verifier, "qr_detector")
    assert isinstance(verifier.qr_detector, cv2.QRCodeDetector)

    payload_url = "https://facilities.aicte-india.org/eoa/verify/1-4567891230"
    pdf_bytes = _create_sample_pdf(with_qr_payload=payload_url)
    records = verifier.decode_qr_codes(pdf_bytes)

    assert len(records) >= 1
    rec = records[0]
    assert rec["type"] == "QRCODE"
    assert rec["raw_payload"] == payload_url
    assert "left" in rec["bounding_box"]
    assert "top" in rec["bounding_box"]
    assert "width" in rec["bounding_box"]
    assert "height" in rec["bounding_box"]


def test_decode_qr_codes_authoritative():
    """Verify decode_qr_codes extracts authoritative AICTE QR payload and coordinates."""
    payload_url = "https://facilities.aicte-india.org/eoa/verify/1-4567891230?app_id=987654"
    pdf_bytes = _create_sample_pdf(with_qr_payload=payload_url)

    records = decode_qr_codes(pdf_bytes)
    assert len(records) >= 1
    rec = records[0]
    assert rec["raw_payload"] == payload_url
    assert rec["payload"] == payload_url
    assert rec["type"] == "QRCODE"
    assert rec["is_authoritative"] is True
    assert rec["domain"] == "facilities.aicte-india.org"
    assert rec["bounding_box"]["width"] > 0
    assert rec["bounding_box"]["height"] > 0
    assert rec["parsed_parameters"].get("app_id") == "987654"


def test_decode_qr_codes_non_authoritative():
    """Verify decode_qr_codes identifies external or untrusted domains."""
    fake_url = "https://untrusted-thirdparty.com/verify?id=123"
    pdf_bytes = _create_sample_pdf(with_qr_payload=fake_url)

    records = decode_qr_codes(pdf_bytes)
    assert len(records) >= 1
    assert records[0]["raw_payload"] == fake_url
    assert records[0]["payload"] == fake_url
    assert records[0]["is_authoritative"] is False
    assert records[0]["domain"] == "untrusted-thirdparty.com"


def test_decode_qr_codes_empty():
    """Verify decode_qr_codes returns empty list on PDFs without QR codes."""
    pdf_bytes = _create_sample_pdf(with_qr_payload="")
    records = decode_qr_codes(pdf_bytes)
    assert records == []


def test_decode_qr_codes_multipage_and_empty_pages():
    """Verify decode_qr_codes handles empty pages, multi-page PDFs, and zero-page PDFs gracefully."""
    doc = fitz.open()
    # Page 0: completely blank
    doc.new_page(width=595, height=842)
    # Page 1: with QR code
    p2 = doc.new_page(width=595, height=842)
    qr = qrcode.QRCode(box_size=6, border=2)
    target_payload = "https://facilities.aicte-india.org/eoa/verify/multipage-test"
    qr.add_data(target_payload)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format="PNG")
    p2.insert_image(fitz.Rect(350, 50, 550, 250), stream=qr_buf.getvalue())
    # Page 2: text only, no QR code
    p3 = doc.new_page(width=595, height=842)
    p3.insert_text((50, 50), "Only text, no QR code")

    pdf_bytes = doc.tobytes()
    doc.close()

    records = decode_qr_codes(pdf_bytes)
    assert len(records) == 1
    assert records[0]["page"] == 1
    assert records[0]["raw_payload"] == target_payload
    assert records[0]["type"] == "QRCODE"
    assert records[0]["bounding_box"]["width"] > 0

    # Also test empty doc with a blank page
    blank_doc = fitz.open()
    blank_doc.new_page(width=595, height=842)
    blank_bytes = blank_doc.tobytes()
    blank_doc.close()
    assert decode_qr_codes(blank_bytes) == []


def test_verify_pki_signature_authentic():
    """Verify pyhanko validates cryptographically intact X.509 signature."""
    pdf_bytes = _create_sample_pdf()
    signed_bytes = _sign_pdf_document(pdf_bytes)

    res = verify_pki_signature(signed_bytes)
    assert res["signatures_found"] == 1
    assert res["all_intact"] is True
    assert res["all_valid"] is True
    assert res["tampered_post_signing"] is False

    sig = res["signatures"][0]
    assert sig["field_name"] == "AICTE_Signature"
    assert sig["intact"] is True
    assert sig["valid"] is True
    assert sig["certificate"] is not None
    assert sig["certificate"]["subject_cn"] == "AICTE Digital Verification Sub-CA"
    assert sig["certificate"]["subject_org"] == "All India Council for Technical Education"


def test_verify_pki_signature_tampered():
    """Verify tampering detection when signed PDF bytes are altered."""
    pdf_bytes = _create_sample_pdf()
    signed_bytes = _sign_pdf_document(pdf_bytes)

    # Tamper with byte inside the document body
    corrupted_bytes = bytearray(signed_bytes)
    corrupted_bytes[120] = (corrupted_bytes[120] + 1) % 256

    res = verify_pki_signature(bytes(corrupted_bytes))
    assert res["signatures_found"] == 1
    assert res["all_intact"] is False
    assert res["tampered_post_signing"] is True
    assert "TAMPERED" in res["signatures"][0]["status_summary"]


def test_verify_pki_signature_unsigned():
    """Verify unsigned document returns zero signatures and no false flags."""
    pdf_bytes = _create_sample_pdf()
    res = verify_pki_signature(pdf_bytes)
    assert res["signatures_found"] == 0
    assert res["all_intact"] is False
    assert res["tampered_post_signing"] is False
    assert res["signatures"] == []


def test_verify_authoritative_source_end_to_end_authentic():
    """Verify end-to-end receipt for signed document with authoritative QR code."""
    payload_url = "https://facilities.aicte-india.org/eoa/verify/1-4567891230"
    pdf_bytes = _create_sample_pdf(with_qr_payload=payload_url)
    signed_pdf = _sign_pdf_document(pdf_bytes)

    receipt = verify_authoritative_source(signed_pdf, filename="aicte_eoa_approved.pdf")
    assert receipt["success"] is True
    assert receipt["overall_status"] == "AUTHENTIC"
    assert receipt["trust_score"] >= 80.0
    assert receipt["pki_verification"]["all_intact"] is True
    assert receipt["qr_verification"]["authoritative_url_matched"] is True
    assert receipt["document_sha256"] != ""
    assert receipt["receipt_id"].startswith("VR-")


def test_api_verify_source_endpoint_signed_pdf():
    """Verify POST /api/v1/verify-source endpoint returns valid receipt."""
    payload_url = "https://facilities.aicte-india.org/eoa/verify/1-4567891230"
    pdf_bytes = _create_sample_pdf(with_qr_payload=payload_url)
    signed_pdf = _sign_pdf_document(pdf_bytes)

    files = {"file": ("aicte_eoa.pdf", signed_pdf, "application/pdf")}
    response = client.post("/api/v1/verify-source", files=files)
    assert response.status_code == 200, f"Error: {response.text}"

    data = response.json()
    validated = SourceVerificationReceipt(**data)
    assert validated.success is True
    assert validated.document_name == "aicte_eoa.pdf"
    assert validated.overall_status == "AUTHENTIC"
    assert validated.pki_verification.signatures_found == 1
    assert validated.qr_verification.authoritative_url_matched is True
    assert len(validated.qr_verification.extracted_records) >= 1
    first_qr = validated.qr_verification.extracted_records[0]
    assert first_qr.type == "QRCODE"
    assert first_qr.raw_payload == payload_url


def test_api_verify_source_endpoint_tampered_pdf():
    """Verify POST /api/v1/verify-source flags tampered signed PDF."""
    pdf_bytes = _create_sample_pdf()
    signed_pdf = bytearray(_sign_pdf_document(pdf_bytes))
    signed_pdf[150] = (signed_pdf[150] + 1) % 256

    files = {"file": ("tampered_eoa.pdf", bytes(signed_pdf), "application/pdf")}
    response = client.post("/api/v1/verify-source", files=files)
    assert response.status_code == 200

    data = response.json()
    validated = SourceVerificationReceipt(**data)
    assert validated.overall_status == "TAMPERED_POST_SIGNING"
    assert validated.trust_score == 0.0


def test_api_verify_source_invalid_format():
    """Verify POST /api/v1/verify-source rejects non-PDF file."""
    files = {"file": ("image_doc.png", b"\x89PNG\r\n\x1a\nFakePng", "image/png")}
    response = client.post("/api/v1/verify-source", files=files)
    assert response.status_code == 400
    assert "requires a PDF document" in response.json()["detail"]


if __name__ == "__main__":
    print("Running Layer 3 Source Verification Unit Tests (native OpenCV)...")
    test_layer_three_source_verifier_class()
    print("[PASS] test_layer_three_source_verifier_class")
    test_decode_qr_codes_authoritative()
    print("[PASS] test_decode_qr_codes_authoritative")
    test_decode_qr_codes_non_authoritative()
    print("[PASS] test_decode_qr_codes_non_authoritative")
    test_decode_qr_codes_empty()
    print("[PASS] test_decode_qr_codes_empty")
    test_decode_qr_codes_multipage_and_empty_pages()
    print("[PASS] test_decode_qr_codes_multipage_and_empty_pages")
    test_verify_pki_signature_authentic()
    print("[PASS] test_verify_pki_signature_authentic")
    test_verify_pki_signature_tampered()
    print("[PASS] test_verify_pki_signature_tampered")
    test_verify_pki_signature_unsigned()
    print("[PASS] test_verify_pki_signature_unsigned")
    test_verify_authoritative_source_end_to_end_authentic()
    print("[PASS] test_verify_authoritative_source_end_to_end_authentic")
    test_api_verify_source_endpoint_signed_pdf()
    print("[PASS] test_api_verify_source_endpoint_signed_pdf")
    test_api_verify_source_endpoint_tampered_pdf()
    print("[PASS] test_api_verify_source_endpoint_tampered_pdf")
    test_api_verify_source_invalid_format()
    print("[PASS] test_api_verify_source_invalid_format")
    print("\nALL 11 TESTS PASSED PERFECTLY!")
