const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "http://localhost:8100";

interface OcrResult {
  storeName: string | null;
  items: Array<{ title: string; price: number; quantity: number }>;
  totalAmount: number;
  purchaseDate: string | null;
}

export async function scanWithOcr(
  imageBase64: string,
  mimeType: string
): Promise<OcrResult | null> {
  try {
    const buffer = Buffer.from(imageBase64, "base64");
    const ext = mimeType.split("/")[1] || "jpeg";
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append("image", blob, `receipt.${ext}`);

    console.log(`[OCR Client] Sending to ${OCR_SERVICE_URL}/api/ocr/scan, size=${buffer.length}`);

    const response = await fetch(`${OCR_SERVICE_URL}/api/ocr/scan`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(60_000),
    });

    console.log(`[OCR Client] Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[OCR Client] Error response: ${text}`);
      return null;
    }

    const data = (await response.json()) as OcrResult;
    console.log(`[OCR Client] Success: ${data.items?.length ?? 0} items`);
    return data;
  } catch (err) {
    console.error(`[OCR Client] Error:`, err instanceof Error ? err.message : err);
    return null;
  }
}
