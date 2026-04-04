import { createLogger } from "@/shared/lib/logger";

const log = createLogger("ocr-client");
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

    log.info("Sending scan request", { url: `${OCR_SERVICE_URL}/api/ocr/scan`, size: buffer.length });

    const response = await fetch(`${OCR_SERVICE_URL}/api/ocr/scan`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      log.warn("OCR service returned error", { status: response.status });
      return null;
    }

    const data = (await response.json()) as OcrResult;
    log.info("Scan completed", { itemCount: data.items?.length ?? 0 });
    return data;
  } catch (err) {
    log.error("Scan failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
