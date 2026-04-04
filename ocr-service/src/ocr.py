"""PaddleOCR wrapper for receipt text extraction."""

import io
import logging
import os
import tempfile
from typing import TypedDict

_ocr = None
logger = logging.getLogger(__name__)


class OcrLine(TypedDict):
    text: str
    confidence: float


def get_ocr():
    """Lazy-initialize PaddleOCR with Japanese support."""
    global _ocr
    if _ocr is None:
        from paddleocr import PaddleOCR

        _ocr = PaddleOCR(
            use_angle_cls=True,
            lang="japan",
            use_gpu=False,
        )
    return _ocr


def extract_text(image_bytes: bytes) -> list[OcrLine]:
    """Extract text lines from receipt image.

    Returns list of {text, confidence} dicts.
    Returns empty list on any failure.
    """
    try:
        from PIL import Image, ImageEnhance

        img = Image.open(io.BytesIO(image_bytes))

        if img.mode != "RGB":
            img = img.convert("RGB")

        # Enhance contrast for thermal paper receipts
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5)
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.3)

        # Save to temp file for PaddleOCR
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            img.save(tmp, format="JPEG", quality=95)
            tmp_path = tmp.name

        try:
            result = get_ocr().ocr(tmp_path, cls=True)

            lines: list[OcrLine] = []

            if not result or not result[0]:
                return lines

            for line_info in result[0]:
                # PaddleOCR ocr() returns [[box, (text, confidence)], ...]
                if len(line_info) >= 2:
                    text_info = line_info[1]
                    if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                        text = str(text_info[0])
                        confidence = float(text_info[1])
                        if text and confidence > 0.3:
                            lines.append({"text": text, "confidence": confidence})

            logger.info("[OCR] Extracted %d lines from image", len(lines))
            for i, line in enumerate(lines[:5]):
                logger.info(
                    "[OCR] Line %d: %s (conf: %.2f)",
                    i,
                    line["text"][:50],
                    line["confidence"],
                )

            return lines

        finally:
            os.unlink(tmp_path)

    except Exception:
        logger.exception("[OCR] Failed to extract text")
        return []
