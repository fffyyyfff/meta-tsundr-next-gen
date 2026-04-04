"""PaddleOCR wrapper for receipt text extraction."""

import io
from typing import TypedDict

import numpy as np
from paddleocr import PaddleOCR
from PIL import Image, ImageEnhance

_ocr: PaddleOCR | None = None


class OcrLine(TypedDict):
    text: str
    confidence: float


def get_ocr() -> PaddleOCR:
    """Lazy-initialize PaddleOCR with Japanese language support."""
    global _ocr
    if _ocr is None:
        _ocr = PaddleOCR(lang="japan")
    return _ocr


def extract_text(image_bytes: bytes) -> list[OcrLine]:
    """Extract text lines from receipt image.

    Applies contrast enhancement for better recognition of thermal paper receipts.
    Returns list of {text, confidence} dicts sorted by vertical position.
    """
    img = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB if necessary
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Enhance contrast (thermal paper receipts are often faded)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)

    # Sharpen for better character recognition
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.3)

    img_array = np.array(img)
    result = get_ocr().ocr(img_array)

    lines: list[OcrLine] = []
    if result:
        for page in result:
            if not page:
                continue
            for line in page:
                try:
                    # PaddleOCR returns various formats depending on version
                    if isinstance(line, dict):
                        # New format: {"text": ..., "score": ...}
                        text = str(line.get("text", line.get("rec_text", "")))
                        confidence = float(line.get("score", line.get("rec_score", 0.0)))
                    elif isinstance(line, (list, tuple)) and len(line) >= 2:
                        rec = line[1]
                        if isinstance(rec, (list, tuple)) and len(rec) >= 2:
                            text = str(rec[0])
                            confidence = float(rec[1])
                        elif isinstance(rec, str):
                            text = rec
                            confidence = 1.0
                        elif isinstance(rec, dict):
                            text = str(rec.get("text", rec.get("rec_text", "")))
                            confidence = float(rec.get("score", rec.get("rec_score", 0.0)))
                        else:
                            continue
                    else:
                        continue

                    if text and confidence > 0.3:
                        lines.append({"text": text, "confidence": confidence})
                except (IndexError, TypeError, ValueError):
                    continue

    return lines
