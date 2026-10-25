"""Pydantic v2 schemas for AICTE Compliance Engine:
Layer 1 (Layout & Information Extraction),
Layer 2 (Visual Forensics Engine),
Layer 3 (Authoritative Source Verification Engine).
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


# ===========================================================================
# Layer 1: Document Ingestion & Extraction Schemas
# ===========================================================================


class LandDetails(BaseModel):
    """Schema representing institutional land parcel details."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    plot_number: str = Field(
        default="",
        description="Plot, Survey, or Khasra number of the institutional land",
    )
    land_area_acres: float = Field(
        default=0.0,
        description="Total land area in acres",
    )
    land_use_certificate_valid: bool = Field(
        default=False,
        description="Validity status of the Land Use Certificate / Change of Land Use (CLU)",
    )


class FacultyRow(BaseModel):
    """Schema representing an individual faculty member record extracted from tables."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    name: str = Field(
        default="",
        description="Full name of the faculty member",
    )
    designation: str = Field(
        default="",
        description="Academic designation (e.g. Professor, Associate Professor, Assistant Professor)",
    )
    department: str = Field(
        default="",
        description="Academic department or discipline (e.g. Computer Science, Mechanical Engineering)",
    )
    qualification: str = Field(
        default="",
        description="Highest educational qualification (e.g. Ph.D, M.Tech, M.E., MCA)",
    )


class ExtractedApplicationPayload(BaseModel):
    """Top-level consolidated schema capturing Layer 1 extracted application data."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    institution_id: str = Field(
        default="",
        description="AICTE Permanent Institute ID or Current Application Number",
    )
    land_info: LandDetails = Field(
        default_factory=LandDetails,
        description="Land specification and zoning details",
    )
    total_builtup_area_sqm: float = Field(
        default=0.0,
        description="Total built-up instructional and administrative area in square meters",
    )
    faculty_list: List[FacultyRow] = Field(
        default_factory=list,
        description="List of faculty records extracted from application tables",
    )
    raw_text: str = Field(
        default="",
        description="Raw full textual content extracted from the document",
    )


# ===========================================================================
# Layer 2: Visual Forensics Schemas
# ===========================================================================


class ELAResult(BaseModel):
    """Error Level Analysis (ELA) computation breakdown and anomaly metrics."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    anomaly_score: float = Field(
        ...,
        description="Normalized ELA anomaly score from 0.0 (consistent) to 100.0 (high tampering probability)",
    )
    mean_difference: float = Field(
        ...,
        description="Mean pixel difference between original and recompressed image",
    )
    max_difference: float = Field(
        ...,
        description="Maximum observed pixel difference across color channels",
    )
    std_difference: float = Field(
        ...,
        description="Standard deviation of pixel difference matrix",
    )
    high_error_ratio: float = Field(
        ...,
        description="Proportion of pixels exhibiting abnormal compression error",
    )
    is_suspicious: bool = Field(
        ...,
        description="Flag indicating if compression error patterns suggest digital tampering or splicing",
    )
    tampering_detected: bool = Field(
        ...,
        description="Synonymous flag indicating if ELA detected anomalies",
    )
    details: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional ELA metadata such as quality level and evaluated image dimensions",
    )


class SuspiciousRegion(BaseModel):
    """Bounding box and metrics for a localized smoothed, blurred, or flattened region."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    x: int = Field(..., description="X coordinate (left) of the bounding box")
    y: int = Field(..., description="Y coordinate (top) of the bounding box")
    width: int = Field(..., description="Width of the bounding box")
    height: int = Field(..., description="Height of the bounding box")
    variance: float = Field(..., description="Laplacian variance within this region")
    label: str = Field(
        default="smoothed_region",
        description="Classification label for the region anomaly",
    )


class BlurDetectionResult(BaseModel):
    """OpenCV cv2.Laplacian blur and text flattening analysis breakdown."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    global_laplacian_variance: float = Field(
        ...,
        description="Overall Laplacian variance of the image (higher means sharper)",
    )
    blur_score: float = Field(
        ...,
        description="Normalized blur/smoothing risk score from 0.0 to 100.0",
    )
    is_blurred: bool = Field(
        ...,
        description="Indicates whether the document or evaluated region is significantly blurred",
    )
    tampering_detected: bool = Field(
        ...,
        description="Flag indicating localized text flattening, smoothing, or erasing artifacts",
    )
    smoothed_regions_count: int = Field(
        default=0,
        description="Number of detected smoothed or flattened regions",
    )
    suspicious_regions: List[SuspiciousRegion] = Field(
        default_factory=list,
        description="List of bounding boxes for smoothed or edited regions",
    )


class PDFMetadataResult(BaseModel):
    """PyMuPDF and pdfminer.six document metadata, timestamp, and revision history analysis."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    producer: Optional[str] = Field(
        default=None,
        description="PDF Producer application string",
    )
    creator: Optional[str] = Field(
        default=None,
        description="PDF Creator software string",
    )
    creation_date: Optional[str] = Field(
        default=None,
        description="Document creation timestamp in PDF/ISO format",
    )
    modification_date: Optional[str] = Field(
        default=None,
        description="Document modification timestamp in PDF/ISO format",
    )
    timestamp_discrepancy: bool = Field(
        default=False,
        description="Whether creation and modification timestamps exhibit suspicious discrepancies",
    )
    time_difference_seconds: Optional[float] = Field(
        default=None,
        description="Elapsed time in seconds between creation and modification",
    )
    revision_count: int = Field(
        default=1,
        description="Number of incremental revision sections / XRef tables discovered in the PDF",
    )
    is_modified: bool = Field(
        default=False,
        description="Indicates whether the document was modified after original creation",
    )
    suspicious_producer: bool = Field(
        default=False,
        description="Flag indicating if the Producer or Creator matches photo manipulation or editing tools",
    )
    is_repaired: bool = Field(
        default=False,
        description="Whether PyMuPDF flagged the PDF structure as repaired or corrupted",
    )
    metadata_risk_score: float = Field(
        default=0.0,
        description="Normalized metadata anomaly score from 0.0 to 100.0",
    )
    anomalies: List[str] = Field(
        default_factory=list,
        description="Explanatory flags for each detected metadata anomaly",
    )


class ForensicsBreakdown(BaseModel):
    """Consolidated breakdown across all Layer 2 visual and structural forensic inspections."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    ela: ELAResult = Field(
        ...,
        description="Error Level Analysis (ELA) results",
    )
    blur_and_smoothing: BlurDetectionResult = Field(
        ...,
        description="OpenCV Laplacian blur and text flattening analysis",
    )
    pdf_metadata: Optional[PDFMetadataResult] = Field(
        default=None,
        description="PDF structural metadata and revision history (None for image uploads)",
    )


class ForensicsResponse(BaseModel):
    """Top-level response payload for POST /api/v1/forensics endpoint."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    success: bool = Field(
        default=True,
        description="Execution status of forensics analysis",
    )
    filename: str = Field(
        ...,
        description="Filename of the uploaded document",
    )
    file_type: str = Field(
        ...,
        description="Detected file type (e.g. 'pdf', 'jpeg', 'png')",
    )
    page_analyzed: int = Field(
        default=0,
        description="Zero-indexed page number evaluated for visual forensics",
    )
    composite_score: float = Field(
        ...,
        description="Aggregate tampering risk score from 0.0 (clean) to 100.0 (high confidence of tampering)",
    )
    risk_level: str = Field(
        ...,
        description="Tampering risk level categorization: 'LOW', 'MEDIUM', or 'HIGH'",
    )
    is_tampered: bool = Field(
        ...,
        description="Boolean verdict indicating whether tampering or manipulation was flagged",
    )
    score_breakdown: ForensicsBreakdown = Field(
        ...,
        description="Detailed forensic component breakdown",
    )
    flags: List[str] = Field(
        default_factory=list,
        description="List of forensic warning flags triggered during inspection",
    )


# ===========================================================================
# Layer 3: Authoritative Source Verification Schemas
# ===========================================================================


class QRCodeBoundingBox(BaseModel):
    """Bounding coordinates of a decoded 2D QR code on the page image."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    left: int = Field(..., description="Left pixel coordinate")
    top: int = Field(..., description="Top pixel coordinate")
    width: int = Field(..., description="Width in pixels")
    height: int = Field(..., description="Height in pixels")


class QRCodeRecord(BaseModel):
    """Structured record of an extracted 2D QR code."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    page: int = Field(default=0, description="Page index where QR code was detected")
    type: str = Field(default="QRCODE", description="Barcode format identifier")
    raw_payload: str = Field(default="", description="Decoded raw textual payload string")
    payload: str = Field(default="", description="Decoded textual payload string or URL")
    code_type: str = Field(default="QRCODE", description="Barcode format identifier")
    bounding_box: QRCodeBoundingBox = Field(
        ..., description="Pixel boundary coordinates of the QR code"
    )
    polygon: List[List[int]] = Field(
        default_factory=list, description="Corner vertex coordinates [[x1, y1], [x2, y2], ...]"
    )
    is_authoritative: bool = Field(
        default=False,
        description="Whether decoded payload points to an authoritative portal (e.g. *.aicte-india.org, *.gov.in)",
    )
    domain: Optional[str] = Field(
        default=None, description="Extracted web domain if payload is a URL"
    )
    parsed_parameters: Dict[str, Any] = Field(
        default_factory=dict, description="Parsed query parameters or structured fields"
    )

    def model_post_init(self, __context: Any) -> None:
        if not self.payload and self.raw_payload:
            self.payload = self.raw_payload
        elif not self.raw_payload and self.payload:
            self.raw_payload = self.payload
        if not self.type and self.code_type:
            self.type = self.code_type
        elif not self.code_type and self.type:
            self.code_type = self.type


class X509CertificateInfo(BaseModel):
    """Details parsed from an embedded X.509 digital certificate."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    subject_cn: str = Field(default="", description="Signer Common Name")
    subject_org: str = Field(default="", description="Signer Organization")
    subject_country: str = Field(default="", description="Signer Country Code")
    issuer_cn: str = Field(default="", description="Issuing CA Common Name")
    issuer_org: str = Field(default="", description="Issuing CA Organization")
    serial_number: str = Field(default="", description="Certificate serial number (hex/int)")
    valid_from: Optional[str] = Field(default=None, description="Validity start timestamp")
    valid_until: Optional[str] = Field(default=None, description="Validity end timestamp")
    is_expired: bool = Field(default=False, description="Whether the certificate is expired")
    is_self_signed: bool = Field(default=False, description="Whether certificate is self-signed")
    raw_subject: str = Field(default="", description="Full subject DN string")
    raw_issuer: str = Field(default="", description="Full issuer DN string")


class PKISignatureRecord(BaseModel):
    """Verification results for an individual embedded PKI digital signature."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    field_name: str = Field(..., description="PDF signature form field identifier")
    intact: bool = Field(
        ...,
        description="True if digest matches signed byte range (cryptographic hash integrity is intact)",
    )
    valid: bool = Field(..., description="True if cryptographic signature syntax and math are valid")
    post_signing_modification: bool = Field(
        default=False,
        description="True if modifications occurred after signature creation (tampering or append)",
    )
    coverage: str = Field(
        default="", description="Document byte coverage level (e.g. ENTIRE_FILE, PARTIAL)"
    )
    signing_time: Optional[str] = Field(
        default=None, description="Timestamp claimed by the digital signature"
    )
    certificate: Optional[X509CertificateInfo] = Field(
        default=None, description="Signer X.509 certificate details"
    )
    status_summary: str = Field(
        default="", description="Human-readable verification status description"
    )


class PKIVerificationResult(BaseModel):
    """Summary of PDF PKI digital signature analysis."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    signatures_found: int = Field(default=0, description="Total number of digital signatures found")
    all_intact: bool = Field(
        default=False, description="True if all signatures pass hash integrity checks"
    )
    all_valid: bool = Field(
        default=False, description="True if all cryptographic signatures are mathematically valid"
    )
    tampered_post_signing: bool = Field(
        default=False, description="True if document changes were detected after signing"
    )
    signatures: List[PKISignatureRecord] = Field(
        default_factory=list, description="Detailed records for each embedded signature"
    )


class QRVerificationResult(BaseModel):
    """Summary of 2D QR code detection and authoritative link checks."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    qr_codes_found: int = Field(default=0, description="Total number of 2D QR codes detected")
    authoritative_url_matched: bool = Field(
        default=False,
        description="True if at least one QR code resolves to an official council/government portal",
    )
    extracted_records: List[QRCodeRecord] = Field(
        default_factory=list, description="Extracted payload records and page bounding boxes"
    )


class SourceVerificationReceipt(BaseModel):
    """Structured cryptographic and authoritative verification receipt (Layer 3)."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    success: bool = Field(default=True, description="Verification execution status")
    document_name: str = Field(..., description="Filename of verified document")
    document_sha256: str = Field(..., description="Cryptographic SHA-256 hash of uploaded file")
    verification_timestamp: str = Field(..., description="ISO 8601 UTC execution timestamp")
    overall_status: str = Field(
        ...,
        description="Authoritative status verdict: 'AUTHENTIC', 'TAMPERED_POST_SIGNING', 'UNVERIFIED', or 'SUSPICIOUS'",
    )
    trust_score: float = Field(
        ...,
        description="Source credibility score from 0.0 (unverified/tampered) to 100.0 (digitally verified authoritative source)",
    )
    pki_verification: PKIVerificationResult = Field(
        ..., description="PKI digital signature and certificate validation results"
    )
    qr_verification: QRVerificationResult = Field(
        ..., description="2D QR code detection, payload extraction, and domain validation results"
    )
    flags: List[str] = Field(
        default_factory=list, description="Forensic and verification warning/informational flags"
    )
    receipt_id: str = Field(..., description="Unique receipt tracking UUID")
