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

const OCR_SERVICE_URL =
  process.env.OCR_SERVICE_URL || "http://localhost:8100";

/**
 * Parse receipt using PaddleOCR microservice (primary method).
 * Converts base64 image to multipart form data and sends to OCR service.
 */
export async function parseReceiptWithOcr(
  imageBase64: string,
  mimeType: string
): Promise<ParsedReceipt | null> {
  try {
    const buffer = Buffer.from(imageBase64, "base64");
    const ext = mimeType.split("/")[1] || "jpeg";
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append("image", blob, `receipt.${ext}`);

    const response = await fetch(`${OCR_SERVICE_URL}/api/ocr/scan`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      storeName: string | null;
      items: ParsedReceiptItem[];
      totalAmount: number;
      purchaseDate: string | null;
      error: string | null;
    };

    if (data.error || !data.storeName) {
      return null;
    }

    return {
      storeName: data.storeName,
      items: data.items,
      totalAmount: data.totalAmount,
      purchaseDate: data.purchaseDate ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Parse receipt using Claude Vision API (fallback method).
 */
async function parseReceiptWithVision(
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

/**
 * Parse receipt: tries OCR service first, falls back to Claude Vision.
 */
export async function parseReceipt(
  imageBase64: string,
  mimeType: string
): Promise<ParsedReceipt | null> {
  // Primary: PaddleOCR microservice
  const ocrResult = await parseReceiptWithOcr(imageBase64, mimeType);
  if (ocrResult) return ocrResult;

  // Fallback: Claude Vision API
  return parseReceiptWithVision(imageBase64, mimeType);
}
