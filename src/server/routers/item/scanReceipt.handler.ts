import { parseReceipt } from "../../services/receipt-parser";

interface ScanReceiptInput {
  image: string;
  mimeType: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  FOOD: ["食", "飲", "菓子", "弁当", "パン", "牛乳", "豆腐", "野菜", "果物", "肉", "魚", "米", "麺"],
  DAILY_GOODS: ["洗剤", "シャンプー", "ティッシュ", "トイレ", "歯", "石鹸", "掃除"],
  CLOTHING: ["服", "シャツ", "パンツ", "靴", "帽子"],
  BOOK: ["本", "雑誌", "コミック", "書籍"],
  ELECTRONICS: ["電池", "ケーブル", "充電", "USB"],
};

function inferCategory(title: string): string {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "OTHER";
}

export async function scanReceiptHandler({
  input,
}: {
  input: ScanReceiptInput;
}) {
  const parsed = await parseReceipt(input.image, input.mimeType);

  if (!parsed) {
    return {
      storeName: null,
      items: [],
      totalAmount: 0,
      purchaseDate: null,
      error: "レシートの解析に失敗しました。画像が鮮明か確認してください。",
    };
  }

  const items = parsed.items.map((item) => ({
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    category: inferCategory(item.title),
  }));

  return {
    storeName: parsed.storeName,
    items,
    totalAmount: parsed.totalAmount,
    purchaseDate: parsed.purchaseDate,
    error: null,
  };
}
