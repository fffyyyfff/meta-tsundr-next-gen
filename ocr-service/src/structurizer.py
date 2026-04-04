"""Structurize OCR text into purchase data using Claude Haiku."""

import json
import os
import re
from typing import Any

import anthropic

from .ocr import OcrLine


def mask_credit_cards(text: str) -> str:
    """Mask credit card numbers for PII protection."""
    return re.sub(r"\b(?:\d[ -]*?){13,19}\b", "****-****-****-XXXX", text)


def structurize(ocr_lines: list[OcrLine]) -> dict[str, Any] | None:
    """Convert OCR text lines to structured purchase JSON using Claude Haiku.

    Uses Claude Haiku ($1/M input) instead of Sonnet for cost efficiency.
    Input is text (not image) so token cost is ~1/10 of Vision API.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    raw_text = "\n".join(line["text"] for line in ocr_lines)
    text = mask_credit_cards(raw_text)

    # Don't log OCR text (PII protection policy)

    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=(
            "レシートOCR結果から購入情報をJSON形式で抽出するアシスタントです。"
            "JSON以外のテキストは一切返さないでください。"
            "価格は税込の数値（カンマなし）、日付はYYYY-MM-DD形式で返してください。"
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"以下のレシートOCRテキストから購入情報を抽出してください:\n\n"
                    f"{text}\n\n"
                    f'JSON形式: {{"storeName":"店舗名","items":[{{"title":"商品名",'
                    f'"price":数値,"quantity":数値}}],"totalAmount":合計金額数値,'
                    f'"purchaseDate":"YYYY-MM-DD"}}'
                ),
            }
        ],
    )

    content = msg.content[0]
    if content.type != "text":
        return None

    match = re.search(r"\{[\s\S]*\}", content.text)
    if not match:
        return None

    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None
