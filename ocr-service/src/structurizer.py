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
        model=os.environ.get("OCR_MODEL", "claude-haiku-4-5-20251001"),
        max_tokens=1024,
        system=(
            "レシートOCR結果から購入情報をJSON形式で抽出するアシスタントです。\n"
            "重要なルール:\n"
            "1. JSON以外のテキストは一切返さないでください\n"
            "2. 価格は税込の数値（カンマなし）\n"
            "3. 日付はYYYY-MM-DD形式\n"
            "4. OCRの誤認識を文脈から推測して補正してください。例:\n"
            "   - 'ガイト'→'ガイド', 'エーシ'→'エージェント'\n"
            "   - 半角カナ・濁点抜け・文字化けを正しい日本語に補正\n"
            "   - ISBNコード(978...)が近くにある場合、それを元に正確な書籍名を推測\n"
            "5. 商品名は完全な正式名称で出力（省略しない）\n"
            "6. カテゴリが書籍の場合、ISBN番号もmetadataに含めてください"
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"以下のレシートOCRテキストから購入情報を抽出してください。\n"
                    f"OCRの文字認識誤りがある可能性があるので、文脈から正しい商品名を推測して補正してください。\n\n"
                    f"--- OCRテキスト ---\n{text}\n--- ここまで ---\n\n"
                    f'JSON形式: {{"storeName":"店舗名","items":[{{"title":"正確な商品名（OCR誤認識を補正）",'
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
