"""書籍レコメンドエージェント: Claude APIで書籍おすすめを生成"""

import json
import os
from typing import Any

import anthropic


SYSTEM_PROMPT = """あなたは書籍推薦の専門家です。
ユーザーの興味・読書履歴に基づいて、おすすめの書籍を5冊推薦してください。

以下のJSON形式で回答してください:
{
  "recommendations": [
    {
      "title": "書籍タイトル",
      "author": "著者名",
      "reason": "おすすめの理由（1-2文）",
      "genre": "ジャンル"
    }
  ]
}"""


class BookRecommendAgent:
    def __init__(self) -> None:
        self.client = anthropic.Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY", ""),
        )

    def execute(
        self, prompt: str, context: dict[str, str] | None = None
    ) -> dict[str, Any]:
        reading_history = ""
        if context:
            if "reading_history" in context:
                reading_history = f"\n\n読書履歴:\n{context['reading_history']}"
            if "genres" in context:
                reading_history += f"\n好きなジャンル: {context['genres']}"

        user_message = f"{prompt}{reading_history}"

        try:
            response = self.client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
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
