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
    formData.append("file", blob, `receipt.${ext}`);

    const response = await fetch(`${OCR_SERVICE_URL}/api/ocr/scan`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as OcrResult;
    return data;
  } catch {
    return null;
  }
}
