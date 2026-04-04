"""書評生成エージェント: Claude APIで書評を生成"""

import os
from typing import Any

import anthropic


SYSTEM_PROMPT = """あなたは文芸批評家です。
指定された書籍について、以下の構成で書評を生成してください:

1. 概要（2-3文）
2. 良い点（箇条書き3つ）
3. 注意点（箇条書き1-2つ）
4. おすすめ度（★1-5）
5. こんな人におすすめ（1文）

JSON形式で回答してください:
{
  "summary": "概要",
  "pros": ["良い点1", "良い点2", "良い点3"],
  "cons": ["注意点1"],
  "rating": 4,
  "recommended_for": "こんな人におすすめ"
}"""


class BookReviewAgent:
    def __init__(self) -> None:
        self.client = anthropic.Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY", ""),
        )

    def execute(
        self, prompt: str, context: dict[str, str] | None = None
    ) -> dict[str, Any]:
        book_info = prompt
        if context:
            if "title" in context:
                book_info = f"書籍: {context['title']}"
            if "author" in context:
                book_info += f"\n著者: {context['author']}"
            if "isbn" in context:
                book_info += f"\nISBN: {context['isbn']}"

        try:
            response = self.client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": book_info}],
            )

            result_text = response.content[0].text  # type: ignore[union-attr]

            return {
                "success": True,
                "result": result_text,
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            }
        except anthropic.APIError as e:
            return {
                "success": False,
                "error": str(e),
                "input_tokens": 0,
                "output_tokens": 0,
            }
