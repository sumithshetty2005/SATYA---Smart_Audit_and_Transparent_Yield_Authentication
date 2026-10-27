"""LayoutLMv3 Ingestion Engine for Layer 1 AICTE Compliance Document Processing."""

import os
import re
import logging
from typing import Any, Dict, List, Optional, Tuple

import fitz  # PyMuPDF
import torch
from PIL import Image
import numpy as np
from transformers import LayoutLMv3ForTokenClassification, LayoutLMv3Processor

from app.schemas.payload import ExtractedApplicationPayload, FacultyRow, LandDetails

logger = logging.getLogger(__name__)


class LayoutLMv3IngestionEngine:
    """Ingestion engine leveraging LayoutLMv3 and PyMuPDF to extract and classify document regions."""

    def __init__(self, model_name: str = "microsoft/layoutlmv3-base", device: Optional[str] = None):
        """Initialize LayoutLMv3 processor and token classification model.

        Args:
            model_name: HuggingFace model identifier. Defaults to 'microsoft/layoutlmv3-base'.
            device: Computing device ('cpu', 'cuda', etc.). If None, automatically detected.
        """
        self.model_name = model_name
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))

        # Initialize processor without OCR to consume PyMuPDF extracted word boxes directly
        self.processor = LayoutLMv3Processor.from_pretrained(self.model_name, apply_ocr=False)
        self.model = LayoutLMv3ForTokenClassification.from_pretrained(self.model_name)
        self.model.to(self.device)
        self.model.eval()
        self._ocr = None

    def _extract_ocr_words(
        self, image: Image.Image, page_w: float, page_h: float
    ) -> List[Tuple[float, float, float, float, str, int, int, int]]:
        """Run PaddleOCR and convert recognized line boxes to PyMuPDF word tuples."""
        if self._ocr is None:
            from paddleocr import PaddleOCR

            self._ocr = PaddleOCR(
                lang="en",
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )

        results = self._ocr.predict(np.asarray(image))
        words_data = []
        for result in results or []:
            result_json = getattr(result, "json", result)
            if callable(result_json):
                result_json = result_json()
            if isinstance(result_json, dict) and "res" in result_json:
                result_json = result_json["res"]
            if not isinstance(result_json, dict):
                continue

            texts = result_json.get("rec_texts")
            if texts is None:
                texts = []
            boxes = result_json.get("rec_boxes")
            if boxes is None:
                boxes = result_json.get("dt_polys")
            if boxes is None:
                boxes = result_json.get("rec_polys")
            if boxes is None:
                boxes = []
            sx, sy = page_w / image.width, page_h / image.height
            for index, (text, points) in enumerate(zip(texts, boxes)):
                text = str(text).strip()
                if not text:
                    continue
                coords = np.asarray(points, dtype=float).reshape(-1, 2)
                if not len(coords):
                    continue
                x0, y0 = coords.min(axis=0)
                x1, y1 = coords.max(axis=0)
                words_data.append((x0 * sx, y0 * sy, x1 * sx, y1 * sy, text, 0, index, 0))
        return words_data

    @staticmethod
    def _normalize_box(
        box: Tuple[float, float, float, float], width: float, height: float
    ) -> List[int]:
        """Normalize coordinates (x0, y0, x1, y1) to [0, 1000] integer scale.

        Args:
            box: Bounding box tuple (x0, y0, x1, y1).
            width: Page width in points.
            height: Page height in points.

        Returns:
            Normalized integer coordinates [x0, y0, x1, y1] clamped to [0, 1000].
        """
        w = max(width, 1.0)
        h = max(height, 1.0)
        nx0 = max(0, min(1000, int(round((box[0] / w) * 1000))))
        ny0 = max(0, min(1000, int(round((box[1] / h) * 1000))))
        nx1 = max(0, min(1000, int(round((box[2] / w) * 1000))))
        ny1 = max(0, min(1000, int(round((box[3] / h) * 1000))))
        if nx1 < nx0:
            nx1 = nx0
        if ny1 < ny0:
            ny1 = ny0
        return [nx0, ny0, nx1, ny1]

    def _classify_regions(
        self,
        page: fitz.Page,
        words_data: List[Tuple[float, float, float, float, str, int, int, int]],
        norm_boxes: List[List[int]],
        token_predictions: List[int],
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Classify bounding regions into document headers, key-value pairs, tables, and seals.

        Combines model token classifications with structural and spatial layout features.
        """
        classified = {
            "document_headers": [],
            "key_value_pairs": [],
            "tables": [],
            "seals": [],
        }

        # 1. Detect Tables using PyMuPDF table detection and structural cell mapping
        table_boxes = []
        try:
            tabs = page.find_tables()
            for tab in tabs:
                t_rect = tab.bbox  # (x0, y0, x1, y1)
                t_norm = self._normalize_box(t_rect, page.rect.width, page.rect.height)
                table_boxes.append(t_rect)
                extracted_data = tab.extract()
                classified["tables"].append(
                    {
                        "bbox": t_norm,
                        "raw_bbox": list(t_rect),
                        "row_count": len(extracted_data) if extracted_data else 0,
                        "data": extracted_data,
                    }
                )
        except Exception:
            pass

        # 2. Detect Seals / Stamps from embedded images, vector graphics, or explicit seal keywords
        images = page.get_images(full=True)
        for img_info in images:
            xref = img_info[0]
            for img_rect in page.get_image_rects(xref):
                norm_img_box = self._normalize_box(
                    (img_rect.x0, img_rect.y0, img_rect.x1, img_rect.y1),
                    page.rect.width,
                    page.rect.height,
                )
                classified["seals"].append(
                    {
                        "bbox": norm_img_box,
                        "type": "image_seal",
                        "description": "Embedded institutional seal or stamp image",
                    }
                )

        # 3. Classify text blocks into document headers, key-value pairs, and seals
        text_blocks = page.get_text("blocks")
        for block in text_blocks:
            # block format: (x0, y0, x1, y1, text, block_no, block_type)
            if len(block) < 5:
                continue
            bx0, by0, bx1, by1, btext = block[0], block[1], block[2], block[3], block[4].strip()
            if not btext:
                continue

            b_norm = self._normalize_box((bx0, by0, bx1, by1), page.rect.width, page.rect.height)

            # Check if block is inside any detected table
            in_table = any(
                bx0 >= (tb[0] - 5) and by0 >= (tb[1] - 5) and bx1 <= (tb[2] + 5) and by1 <= (tb[3] + 5)
                for tb in table_boxes
            )
            if in_table:
                continue

            # Check seal keywords
            lower_text = btext.lower()
            if any(term in lower_text for term in ["affix seal", "institute seal", "registrar seal", "authorized signatory", "seal & signature"]):
                classified["seals"].append(
                    {
                        "bbox": b_norm,
                        "text": btext,
                        "type": "seal_region",
                    }
                )
                continue

            # Document headers: Top 22% of page, or header-like title text
            is_header_zone = b_norm[1] <= 220
            is_header_text = any(
                k in lower_text
                for k in [
                    "all india council",
                    "aicte",
                    "approval process",
                    "mandatory disclosure",
                    "government of india",
                    "extension of approval",
                    "deficiency report",
                    "institution report",
                ]
            )

            if is_header_zone or is_header_text:
                classified["document_headers"].append(
                    {
                        "bbox": b_norm,
                        "text": btext,
                    }
                )
            elif ":" in btext or "-" in btext or "\t" in btext:
                # Key-value line items
                classified["key_value_pairs"].append(
                    {
                        "bbox": b_norm,
                        "text": btext,
                    }
                )
            else:
                # General key-value / descriptive text
                classified["key_value_pairs"].append(
                    {
                        "bbox": b_norm,
                        "text": btext,
                    }
                )

        return classified

    def _parse_extracted_payload(
        self,
        raw_text: str,
        classified_regions: Dict[str, List[Dict[str, Any]]],
    ) -> ExtractedApplicationPayload:
        """Parse structured compliance fields from extracted text and regions."""
        # 1. Institution ID
        inst_patterns = [
            r"(?:Permanent\s+Institute\s+Id|Permanent\s+ID|Institute\s+Id|Application\s+Id|AICTE\s+ID)[:\s]+([A-Za-z0-9\-_/]+)",
            r"(?:Application\s+Number|App\s+No)[:\s]+([A-Za-z0-9\-_/]+)",
            r"(?:1-\d{8,12})",
        ]
        institution_id = ""
        for pattern in inst_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                institution_id = match.group(1) if match.groups() else match.group(0)
                institution_id = institution_id.strip()
                break

        # 2. Land Details
        # Plot number
        plot_match = re.search(
            r"(?:Plot\s*(?:No\.?|Number)|Survey\s*(?:No\.?|Number)|Khasra\s*(?:No\.?|Number)|Dag\s*(?:No\.?|Number))[:\s]*([A-Za-z0-9\-_\s/]+?)(?=[,\n;]|$)",
            raw_text,
            re.IGNORECASE,
        )
        plot_number = plot_match.group(1).strip() if plot_match else ""

        # Land area in acres
        area_match = re.search(
            r"(?:Total\s*Land\s*Area|Land\s*Area|Area\s*of\s*Land)[:\s]*([0-9.]+)\s*(?:Acres?|acre)?",
            raw_text,
            re.IGNORECASE,
        )
        land_area_acres = 0.0
        if area_match:
            try:
                land_area_acres = float(area_match.group(1).strip())
            except ValueError:
                land_area_acres = 0.0

        # Land use certificate validity
        luc_valid = False
        luc_match = re.search(
            r"(?:Land\s*Use\s*Certificate|CLU|Change\s*of\s*Land\s*Use)[\s\w]*?(?:Valid|Yes|Approved|True)",
            raw_text,
            re.IGNORECASE,
        )
        if luc_match:
            luc_valid = True
        elif re.search(r"Land\s*Use\s*Certificate[\s:]*(?:Valid|Yes)", raw_text, re.IGNORECASE):
            luc_valid = True

        land_info = LandDetails(
            plot_number=plot_number,
            land_area_acres=land_area_acres,
            land_use_certificate_valid=luc_valid,
        )

        # 3. Total built-up area (sqm)
        builtup_match = re.search(
            r"(?:Total\s*Built[\s-]*up\s*Area|Built[\s-]*up\s*Area|Total\s*Builtup\s*Area)[:\s]*([0-9,.]+)\s*(?:sq\.?\s*m|sqm|sq\s*meters)?",
            raw_text,
            re.IGNORECASE,
        )
        total_builtup_area_sqm = 0.0
        if builtup_match:
            try:
                cleaned_val = builtup_match.group(1).replace(",", "").strip()
                total_builtup_area_sqm = float(cleaned_val)
            except ValueError:
                total_builtup_area_sqm = 0.0

        # 4. Faculty list from tables and text patterns
        faculty_list: List[FacultyRow] = []

        # Check extracted table grids first
        for table in classified_regions.get("tables", []):
            table_data = table.get("data", [])
            if not table_data or len(table_data) < 2:
                continue

            # Identify column indices
            header_row = [str(cell or "").lower() for cell in table_data[0]]
            name_idx, desig_idx, dept_idx, qual_idx = -1, -1, -1, -1

            for idx, col in enumerate(header_row):
                if any(k in col for k in ["name", "faculty", "teacher"]):
                    name_idx = idx
                elif any(k in col for k in ["designation", "post", "role"]):
                    desig_idx = idx
                elif any(k in col for k in ["department", "dept", "branch", "discipline"]):
                    dept_idx = idx
                elif any(k in col for k in ["qualification", "qual", "degree"]):
                    qual_idx = idx

            if name_idx != -1:
                for row in table_data[1:]:
                    if len(row) <= name_idx:
                        continue
                    name_val = str(row[name_idx] or "").strip()
                    if not name_val or name_val.lower() in ["name", "faculty name"]:
                        continue

                    desig_val = str(row[desig_idx] or "").strip() if (desig_idx != -1 and len(row) > desig_idx) else ""
                    dept_val = str(row[dept_idx] or "").strip() if (dept_idx != -1 and len(row) > dept_idx) else ""
                    qual_val = str(row[qual_idx] or "").strip() if (qual_idx != -1 and len(row) > qual_idx) else ""

                    faculty_list.append(
                        FacultyRow(
                            name=name_val,
                            designation=desig_val,
                            department=dept_val,
                            qualification=qual_val,
                        )
                    )

        # Fallback to regex pattern matching for faculty entries if tables did not yield rows
        if not faculty_list:
            faculty_pattern = re.compile(
                r"(?:Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+[A-Za-z\s.]+(?:,\s*(?:Professor|Associate\s+Professor|Assistant\s+Professor|Principal|Lecturer|HOD|Dean)[^,\n]*)(?:,[^,\n]+)*",
                re.IGNORECASE,
            )
            for f_match in faculty_pattern.finditer(raw_text):
                line = f_match.group(0).strip()
                parts = [p.strip() for p in line.split(",") if p.strip()]
                name_cand = parts[0] if parts else ""
                desig_cand = parts[1] if len(parts) > 1 else ""
                dept_cand = parts[2] if len(parts) > 2 else ""
                qual_cand = parts[3] if len(parts) > 3 else ""

                if name_cand:
                    faculty_list.append(
                        FacultyRow(
                            name=name_cand,
                            designation=desig_cand,
                            department=dept_cand,
                            qualification=qual_cand,
                        )
                    )

        return ExtractedApplicationPayload(
            institution_id=institution_id,
            land_info=land_info,
            total_builtup_area_sqm=total_builtup_area_sqm,
            faculty_list=faculty_list,
            raw_text=raw_text,
        )

    def process_pdf_page(self, pdf_path: str, page_num: int = 0) -> dict:
        """Process a specific PDF page using LayoutLMv3 and PyMuPDF.

        Converts the page to an image, extracts text tokens and normalized 2D bounding boxes,
        performs token classification inference, categorizes document regions, and parses key
        application fields into an ExtractedApplicationPayload dictionary.

        Args:
            pdf_path: Filesystem path to the input PDF document.
            page_num: Zero-indexed page number to extract (default: 0).

        Returns:
            Dictionary representation of ExtractedApplicationPayload including classified regions.
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF document not found at: {pdf_path}")

        doc = fitz.open(pdf_path)
        try:
            if page_num < 0 or page_num >= len(doc):
                raise IndexError(f"Page number {page_num} out of range for document with {len(doc)} pages.")

            page = doc.load_page(page_num)
            page_rect = page.rect
            page_w, page_h = page_rect.width, page_rect.height

            # 1. Convert target page to PIL Image
            pix = page.get_pixmap(dpi=150)
            image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

            # 2. Extract text tokens and normalized 2D bounding boxes (x0, y0, x1, y1)
            raw_text = page.get_text()
            words_data = page.get_text("words")  # (x0, y0, x1, y1, word, block_no, line_no, word_no)

            # Use PaddleOCR for scanned/image-only pages; keep native PDF text when present.
            if len(raw_text.strip()) < 20:
                try:
                    words_data = self._extract_ocr_words(image, page_w, page_h)
                    if words_data:
                        raw_text = "\n".join(item[4] for item in words_data)
                except Exception as exc:
                    logger.warning("PaddleOCR unavailable for scanned PDF page %s: %s", page_num, exc)

            words: List[str] = []
            norm_boxes: List[List[int]] = []

            for w_item in words_data:
                token_text = w_item[4].strip()
                if not token_text:
                    continue
                words.append(token_text)
                norm_boxes.append(self._normalize_box((w_item[0], w_item[1], w_item[2], w_item[3]), page_w, page_h))

            # Handle edge-case of completely blank/scanned pages without text layer
            if not words:
                words = [""]
                norm_boxes = [[0, 0, 0, 0]]

            # 3. Run LayoutLMv3 inference for token and bounding region classification
            max_tokens = min(len(words), 512)
            sub_words = words[:max_tokens]
            sub_boxes = norm_boxes[:max_tokens]

            encoding = self.processor(
                image,
                text=sub_words,
                boxes=sub_boxes,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding="max_length",
            )

            # Move tensors to device
            input_tensor_keys = ["input_ids", "attention_mask", "bbox", "pixel_values"]
            model_inputs = {
                k: encoding[k].to(self.device)
                for k in input_tensor_keys
                if k in encoding
            }

            with torch.no_grad():
                outputs = self.model(**model_inputs)
                logits = outputs.logits
                predictions = torch.argmax(logits, dim=-1).squeeze(0).tolist()
                if isinstance(predictions, int):
                    predictions = [predictions]

            # 4. Classify bounding regions into document headers, key-value pairs, tables, and seals
            classified_regions = self._classify_regions(
                page=page,
                words_data=words_data,
                norm_boxes=norm_boxes,
                token_predictions=predictions,
            )

            # 5. Parse key extracted fields into ExtractedApplicationPayload
            payload = self._parse_extracted_payload(raw_text, classified_regions)

            # Return as dictionary
            result_dict = payload.model_dump()
            result_dict["classified_regions"] = classified_regions
            return result_dict

        finally:
            doc.close()
