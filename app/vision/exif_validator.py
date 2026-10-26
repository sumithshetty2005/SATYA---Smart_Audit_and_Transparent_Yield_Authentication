"""Photo EXIF Geotag & Infrastructure Cadastral Validator (Layer 5).

Implements:
1. Native Pillow extraction of EXIF tags, GPS rational tuples, and hardware metadata.
2. Conversion of DMS GPS coordinates into decimal degrees format.
3. Geodesic distance calculation (Haversine) against institutional land deed centroid.
4. Non-punitive reporting: Missing or inconsistent metadata is reported as inconclusive.
5. Anti-spoofing and editing tool inspection (Photoshop/GIMP software tags).
6. Deterministic SHA-256 Merkle Leaf Hash generation for Layer 6 audit engine.
"""

from __future__ import annotations

import hashlib
import io
import math
from typing import Any, Dict, List, Optional, Tuple, Union

from PIL import ExifTags, Image

# Earth radius in meters
EARTH_RADIUS_METERS = 6371000.0

# Suspicious editing tools that may alter authenticity
MANIPULATION_TOOLS = [
    "photoshop",
    "gimp",
    "canva",
    "picsart",
    "lightroom",
    "pixlr",
    "snapseed",
]


def _read_image_bytes(image_input: Union[str, bytes, io.BytesIO]) -> bytes:
    if isinstance(image_input, bytes):
        return image_input
    elif isinstance(image_input, io.BytesIO):
        image_input.seek(0)
        return image_input.read()
    elif isinstance(image_input, str):
        with open(image_input, "rb") as f:
            return f.read()
    raise ValueError(f"Unsupported image input type: {type(image_input)}")


def _to_float(val: Any) -> float:
    """Safely converts IFDRational or tuple to float."""
    try:
        if hasattr(val, "numerator") and hasattr(val, "denominator"):
            return float(val.numerator) / float(val.denominator) if val.denominator != 0 else 0.0
        elif isinstance(val, (tuple, list)) and len(val) == 2:
            return float(val[0]) / float(val[1]) if val[1] != 0 else 0.0
        return float(val)
    except (ValueError, ZeroDivisionError, TypeError):
        return 0.0


def _dms_to_decimal(dms: Any, ref: str) -> float:
    """Converts Degrees, Minutes, Seconds tuple to decimal degrees."""
    if not dms or len(dms) < 3:
        return 0.0
    deg = _to_float(dms[0])
    minute = _to_float(dms[1])
    sec = _to_float(dms[2])
    dec = deg + (minute / 60.0) + (sec / 3600.0)
    if str(ref).strip().upper() in ["S", "W"]:
        dec = -dec
    return round(dec, 6)


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculates geodesic distance between two GPS coordinates in meters."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return round(EARTH_RADIUS_METERS * c, 2)


class PhotoEXIFValidator:
    """Validates camera hardware EXIF, GPS coordinates, and spatial geofence."""

    def inspect_photo(
        self,
        image_input: Union[str, bytes, io.BytesIO],
        filename: str = "infrastructure_photo.jpg",
        declared_latitude: Optional[float] = None,
        declared_longitude: Optional[float] = None,
        survey_tolerance_meters: float = 150.0,
    ) -> Dict[str, Any]:
        """Extracts EXIF metadata, evaluates GPS distance, and returns advisory verdict."""
        img_bytes = _read_image_bytes(image_input)
        img = Image.open(io.BytesIO(img_bytes))

        # Raw EXIF parsing
        exif_raw = img.getexif()
        has_exif = exif_raw is not None and len(exif_raw) > 0

        parsed_tags: Dict[str, Any] = {}
        gps_tags: Dict[str, Any] = {}

        if has_exif:
            for tag_id, value in exif_raw.items():
                tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                # Skip massive binary dumps
                if tag_name not in ("MakerNote", "UserComment"):
                    parsed_tags[tag_name] = value

            # Extract GPS sub-IFD (tag 34853)
            gps_info = exif_raw.get_ifd(ExifTags.IFD.GPSInfo) if hasattr(exif_raw, "get_ifd") else {}
            if gps_info:
                for k, v in gps_info.items():
                    gps_name = ExifTags.GPSTAGS.get(k, str(k))
                    gps_tags[gps_name] = v

        # Extract GPS Decimal Coordinates
        has_gps = "GPSLatitude" in gps_tags and "GPSLongitude" in gps_tags
        lat = 0.0
        lon = 0.0
        alt = 0.0
        distance_meters: Optional[float] = None
        geofence_valid: Optional[bool] = None
        geofence_status: str

        if has_gps:
            lat = _dms_to_decimal(gps_tags.get("GPSLatitude"), gps_tags.get("GPSLatitudeRef", "N"))
            lon = _dms_to_decimal(gps_tags.get("GPSLongitude"), gps_tags.get("GPSLongitudeRef", "E"))
            alt = _to_float(gps_tags.get("GPSAltitude", 0.0))
            if declared_latitude is not None and declared_longitude is not None:
                distance_meters = calculate_haversine_distance(
                    declared_latitude, declared_longitude, lat, lon
                )
                geofence_valid = distance_meters <= survey_tolerance_meters
                geofence_status = "VALID" if geofence_valid else "GEOFENCE_EXCEEDED"
            else:
                geofence_status = "REFERENCE_LOCATION_UNAVAILABLE"
        else:
            geofence_status = "INCONCLUSIVE_NO_GPS"

        # Hardware and Capture metadata
        make = str(parsed_tags.get("Make", "")).strip()
        model = str(parsed_tags.get("Model", "")).strip()
        capture_device = f"{make} {model}".strip() if make or model else "Not present in image metadata"

        capture_timestamp = str(parsed_tags.get("DateTimeOriginal") or parsed_tags.get("DateTime") or "Not present in image metadata")
        software = str(parsed_tags.get("Software", "")).strip()

        # Software tampering / editing check
        software_tampered = any(tool in software.lower() for tool in MANIPULATION_TOOLS)

        # Build limitations and advisory notes
        limitations: List[str] = []
        if not has_gps:
            limitations.append(
                "Photo does not contain embedded GPSInfo metadata (common in sanitized or web uploads). "
                "Reported as INCONCLUSIVE; physical verification may be required."
            )
        else:
            limitations.append(
                f"GPS coordinates parsed from hardware EXIF tags with {survey_tolerance_meters}m cadastral tolerance."
            )

        if software_tampered:
            limitations.append(
                f"Software metadata tag indicates editing tool ('{software}'). Advisory scrutiny recommended."
            )

        advisory_verdict = (
            "VALID_IN_BOUNDS"
            if (has_gps and geofence_valid)
            else "INCONCLUSIVE"
            if not has_gps or geofence_valid is None
            else "OUT_OF_BOUNDS_ADVISORY"
        )

        # Merkle leaf digest
        digest_preimage = (
            f"LAYER5_EXIF:{filename}:{lat:.5f}:{lon:.5f}:{distance_meters}:{geofence_status}"
        )
        merkle_leaf_hash = hashlib.sha256(digest_preimage.encode()).hexdigest()

        return {
            "success": True,
            "processing_status": "COMPLETED",
            "method": "PILLOW_EXIF_GEOTAG_PARSER",
            "evidence_location": filename,
            "has_exif": has_exif,
            "has_gps": has_gps,
            "geotagPhoto": {
                "hasGPS": has_gps,
                "latitude": round(lat, 5),
                "longitude": round(lon, 5),
                "altitudeMeters": round(alt, 1),
                "captureDevice": capture_device,
                "timestamp": capture_timestamp,
                "distanceFromPlotCentroidMeters": round(distance_meters, 1) if distance_meters is not None else None,
                "surveyToleranceMeters": survey_tolerance_meters,
                "geofenceValid": geofence_valid,
                "geofenceStatus": geofence_status,
                "streetAddress": (
                    f"GPS coordinates extracted; address not resolved ({lat:.4f}, {lon:.4f})"
                    if has_gps
                    else "Not available - no GPS metadata"
                ),
            },
            "declared_campus_centroid": {
                "latitude": declared_latitude,
                "longitude": declared_longitude,
            },
            "software_tag": software if software else "Not present in image metadata",
            "software_editing_flag": software_tampered,
            "advisory_verdict": advisory_verdict,
            "limitations": limitations,
            "recommended_action": (
                "Cross-reference photo coordinates with Layer 1 land deed survey boundaries."
            ),
            "merkle_leaf_hash": merkle_leaf_hash,
        }


# Singleton holder
_exif_validator_instance: Optional[PhotoEXIFValidator] = None


def get_exif_validator() -> PhotoEXIFValidator:
    global _exif_validator_instance
    if _exif_validator_instance is None:
        _exif_validator_instance = PhotoEXIFValidator()
    return _exif_validator_instance
