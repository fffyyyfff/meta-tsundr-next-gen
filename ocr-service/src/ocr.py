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
        _ocr = PaddleOCR(lang="japan", use_gpu=False)
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
    result = get_ocr().ocr(img_array, cls=True)

    lines: list[OcrLine] = []
    if result and result[0]:
        for line in result[0]:
            text = line[1][0]
            confidence = float(line[1][1])
            if confidence > 0.3:  # Filter low-confidence results
                lines.append({"text": text, "confidence": confidence})

    return lines
