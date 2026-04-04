"""Meta-tsundr OCR Service — PaddleOCR + Claude Haiku for receipt scanning."""

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .ocr import extract_text
from .structurizer import structurize

app = FastAPI(title="Meta-tsundr OCR Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy", "model": "PaddleOCR PP-OCRv5", "service": "ocr-service"}


@app.post("/api/ocr/scan")
async def scan_receipt(image: UploadFile):
    """Scan receipt image and extract purchase data.

    Security:
    - Max file size: 10MB
    - Image processed in memory only (no disk storage)
    - OCR text not logged (PII protection)
    - Credit card numbers masked before AI processing
    """
    # Validate file size
    data = await image.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    # Validate content type
    content_type = image.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # OCR extraction (in-memory, no disk write)
    lines = extract_text(data)

    if not lines:
        return {
            "storeName": None,
            "items": [],
            "totalAmount": 0,
            "purchaseDate": None,
            "ocrText": "",
            "ocrLines": [],
            "error": "OCRでテキストを検出できませんでした。画像が鮮明か確認してください。",
        }

    # Structurize with Claude Haiku
    result = structurize(lines)

    ocr_text = "\n".join(line["text"] for line in lines)

    if not result:
        return {
            "storeName": None,
            "items": [],
            "totalAmount": 0,
            "purchaseDate": None,
            "ocrText": ocr_text,
            "ocrLines": lines,
            "error": "構造化に失敗しました。ANTHROPIC_API_KEYが設定されているか確認してください。",
        }

    return {
        **result,
        "ocrText": ocr_text,
        "ocrLines": lines,
        "error": None,
    }
