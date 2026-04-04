"""PaddleOCR wrapper for receipt text extraction."""

import io
import os
from typing import TypedDict

import numpy as np
from PIL import Image, ImageEnhance

_ocr = None


class OcrLine(TypedDict):
    text: str
    confidence: float


def get_ocr():
    """Lazy-initialize PaddleOCR."""
    global _ocr
    if _ocr is None:
        from paddleocr import PaddleOCR

        _ocr = PaddleOCR(
            lang="japan",
            ocr_version="PP-OCRv4",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )
    return _ocr


def extract_text(image_bytes: bytes) -> list[OcrLine]:
    """Extract text lines from receipt image using PaddleOCR v3+ predict() API."""
    img = Image.open(io.BytesIO(image_bytes))

    if img.mode != "RGB":
        img = img.convert("RGB")

    # Enhance contrast for thermal paper receipts
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.3)

    # Save to temp file (PaddleOCR v3+ predict() works best with file path)
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        img.save(tmp, format="JPEG", quality=95)
        tmp_path = tmp.name

    try:
        result = get_ocr().predict(input=tmp_path)

        lines: list[OcrLine] = []

        for res in result:
            # PaddleOCR v3+ returns objects with rec_texts and rec_scores attributes
            rec_texts = getattr(res, "rec_texts", None)
            rec_scores = getattr(res, "rec_scores", None)

            if rec_texts and rec_scores:
                for text, score in zip(rec_texts, rec_scores):
                    score_val = float(score)
                    if text and score_val > 0.3:
                        lines.append({"text": str(text), "confidence": score_val})
                continue

            # Fallback: try dict-like access
            if isinstance(res, dict):
                texts = res.get("rec_texts", res.get("rec_text", []))
                scores = res.get("rec_scores", res.get("rec_score", []))
                if isinstance(texts, str):
                    texts = [texts]
                    scores = [scores]
                for text, score in zip(texts, scores):
                    score_val = float(score)
                    if text and score_val > 0.3:
                        lines.append({"text": str(text), "confidence": score_val})

        print(f"[OCR] Extracted {len(lines)} lines from image")
        for i, line in enumerate(lines[:5]):
            print(f"[OCR] Line {i}: {line['text'][:50]} (conf: {line['confidence']:.2f})")

        return lines

    finally:
        os.unlink(tmp_path)
