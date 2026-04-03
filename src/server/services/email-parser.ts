import Anthropic from "@anthropic-ai/sdk";

interface ParsedOrder {
  items: Array<{ title: string; price: number; quantity: number }>;
  orderNumber: string;
  orderDate: string;
}

export type { ParsedOrder };

/** Strip style/script/head/img tags completely */
function stripNonContentTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<img[^>]*>/gi, "");
}

/** Convert HTML tables to readable text preserving structure */
function tableToText(html: string): string {
  return html
    .replace(/<\/td>/gi, "\t")
    .replace(/<\/th>/gi, "\t")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function extractAmazonContent(html: string): string {
  const cleaned = stripNonContentTags(html);
  const sections: string[] = [];

  // 1. Extract order number (D01-xxx or 250-xxx pattern)
  const orderNumMatch = cleaned.match(/[A-Z]?\d{3}-\d{7}-\d{7}/);
  if (orderNumMatch) {
    sections.push(`注文番号: ${orderNumMatch[0]}`);
  }

  // 2. Extract order date
  const dateMatch = cleaned.match(
    /(\d{4})[年/.-](\d{1,2})[月/.-](\d{1,2})[日]?/
  );
  if (dateMatch) {
    sections.push(`注文日: ${dateMatch[0]}`);
  }

  // 3. Extract all prices
  const prices: string[] = [];
  const priceRegex = /[¥￥]\s?([\d,]+)/g;
  let priceMatch: RegExpExecArray | null;
  while ((priceMatch = priceRegex.exec(cleaned)) !== null) {
    prices.push(priceMatch[0]);
  }
  if (prices.length > 0) {
    sections.push(`検出された金額: ${[...new Set(prices)].join(", ")}`);
  }

  // 4. Extract product section - look for order confirmation area
  const orderPatterns = [
    /ご注文の確認[\s\S]{0,6000}?(?:合計|小計|お支払い)/i,
    /注文内容[\s\S]{0,6000}?(?:合計|小計|お支払い)/i,
    /注文済み[\s\S]{0,6000}?(?:合計|小計|お支払い)/i,
    /お届け予定[\s\S]{0,6000}?(?:合計|小計|お支払い)/i,
  ];

  let productSection = "";
  for (const pattern of orderPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      productSection = tableToText(match[0]);
      break;
    }
  }

  if (productSection) {
    sections.push(`--- 注文内容 ---\n${productSection}`);
  } else {
    // Fallback: extract text around product-related keywords
    const fullText = tableToText(cleaned);
    const productStart = fullText.search(/注文|ご購入|お届け|商品/);
    if (productStart >= 0) {
      sections.push(
        `--- メール内容 ---\n${fullText.slice(
          Math.max(0, productStart - 100),
          productStart + 3000
        )}`
      );
    } else {
      // Last resort: take middle portion (skip header/footer noise)
      const mid = Math.floor(fullText.length / 4);
      sections.push(
        `--- メール内容 ---\n${fullText.slice(mid, mid + 3000)}`
      );
    }
  }

  // 5. Extract link text that likely contains product names
  const linkTexts: string[] = [];
  const linkRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(cleaned)) !== null) {
    const text = linkMatch[1].replace(/<[^>]*>/g, "").trim();
    // Product names are typically 5+ chars, not URLs, not navigation
    if (
      text.length > 5 &&
      text.length < 200 &&
      !text.startsWith("http") &&
      !/^(ログイン|アカウント|ヘルプ|返品|配送|カート|Amazon|注文)/.test(text)
    ) {
      linkTexts.push(text);
    }
  }
  if (linkTexts.length > 0) {
    sections.push(
      `--- リンクテキスト(商品名候補) ---\n${linkTexts.slice(0, 10).join("\n")}`
    );
  }

  const result = sections.join("\n\n").slice(0, 2000);
  console.warn(
    `[Email Parser] Amazon extracted: ${result.length} chars, ${prices.length} prices, ${linkTexts.length} links`
  );
  return result;
}

function extractRakutenContent(html: string): string {
  const cleaned = stripNonContentTags(html);
  const text = tableToText(cleaned);

  const orderStart = text.search(/注文|ご購入|ご注文/);
  if (orderStart > 0) {
    return text.slice(Math.max(0, orderStart - 200), orderStart + 3000);
  }

  return text.slice(0, 3000);
}

function extractRelevantContent(
  bodyHtml: string,
  source: "amazon" | "rakuten"
): string {
  if (source === "amazon") {
    return extractAmazonContent(bodyHtml);
  }
  return extractRakutenContent(bodyHtml);
}

export async function parseOrderEmail(
  bodyHtml: string,
  source: "amazon" | "rakuten"
): Promise<ParsedOrder | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const text = extractRelevantContent(bodyHtml, source);

  console.warn(
    `[Email Parser] Source: ${source}, Extracted text length: ${text.length}`
  );
  console.warn(`[Email Parser] Preview: ${text.slice(0, 200)}`);

  if (text.length < 20) return null;

  const client = new Anthropic();

  const systemPrompt =
    source === "amazon"
      ? "Amazon.co.jpの注文確認メールから購入情報を抽出するアシスタントです。商品名はリンクテキストから、価格は¥記号付きの数値から特定してください。必ずJSON形式で返してください。"
      : "ECサイトの注文確認メールから購入情報を抽出。必ずJSON形式で返す。";

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `以下は${source === "amazon" ? "Amazon.co.jp" : "楽天"}の注文確認メールから抽出した情報です。商品名と価格を正確にJSON化してください。\n\n${text}\n\nJSON形式で返答: {items:[{title:string,price:number,quantity:number}],orderNumber:string,orderDate:string}`,
      },
    ],
  });

  const content = msg.content[0];
  if (content.type !== "text") return null;

  try {
    const match = content.text.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as ParsedOrder) : null;
  } catch {
    return null;
  }
}
