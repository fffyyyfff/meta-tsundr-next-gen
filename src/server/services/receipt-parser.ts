import Anthropic from "@anthropic-ai/sdk";

export interface ParsedReceiptItem {
  title: string;
  price: number;
  quantity: number;
}

export interface ParsedReceipt {
  storeName: string;
  items: ParsedReceiptItem[];
  totalAmount: number;
  purchaseDate: string;
  paymentMethod?: string;
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function parseReceipt(
  imageBase64: string,
  mimeType: string
): Promise<ParsedReceipt | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const client = new Anthropic();

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as ImageMediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: 'このレシート画像から購入情報を抽出してJSON形式で返してください。\n\nJSON形式: {"storeName":"店舗名","items":[{"title":"商品名","price":数値,"quantity":数値}],"totalAmount":合計金額数値,"purchaseDate":"YYYY-MM-DD","paymentMethod":"支払方法"}\n\n注意:\n- 価格は税込の数値(カンマなし)\n- 日付はYYYY-MM-DD形式\n- 商品名は正確に読み取ること\n- 値引き・割引は別の行として含めないこと\n- JSON以外のテキストは返さないこと',
          },
        ],
      },
    ],
  });

  const content = msg.content[0];
  if (content.type !== "text") return null;

  try {
    const match = content.text.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as ParsedReceipt) : null;
  } catch {
    return null;
  }
}
