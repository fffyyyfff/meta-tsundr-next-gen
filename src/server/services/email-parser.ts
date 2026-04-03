import Anthropic from "@anthropic-ai/sdk";

interface ParsedOrder {
  items: Array<{ title: string; price: number; quantity: number }>;
  orderNumber: string;
  orderDate: string;
}

export type { ParsedOrder };

function extractRelevantContent(
  bodyHtml: string,
  source: "amazon" | "rakuten"
): string {
  // Remove style/script tags entirely first
  let html = bodyHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  if (source === "amazon") {
    const sections: string[] = [];

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) sections.push(titleMatch[1].trim());

    // Extract order details section
    const orderSection = html.match(
      /注文内容[\s\S]{0,8000}?(?:小計|合計|お支払い)[\s\S]{0,2000}?(?=<\/table|<\/div>|$)/i
    );
    if (orderSection) {
      sections.push(
        orderSection[0].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      );
    }

    // Extract product names and prices via patterns
    const productPattern =
      /(?:商品名|タイトル|item)[^<]*?<[^>]*>([^<]+)<[\s\S]*?(?:¥|￥|円)\s*([\d,]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = productPattern.exec(html)) !== null) {
      sections.push(`商品: ${match[1].trim()} 価格: ${match[2]}`);
    }

    // Fallback: extract subtotal/total area
    const totalArea = html.match(
      /(?:小計|合計|注文番号)[\s\S]{0,500}/gi
    );
    if (totalArea) {
      for (const area of totalArea.slice(0, 3)) {
        sections.push(
          area.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        );
      }
    }

    if (sections.length > 0) {
      return sections.join("\n\n").slice(0, 4000);
    }
  }

  // Rakuten or fallback: strip tags and take relevant portion
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  // Try to find order-relevant section
  const orderStart = text.search(/注文|ご購入|ご注文/);
  if (orderStart > 0) {
    return text.slice(Math.max(0, orderStart - 200), orderStart + 4000);
  }

  return text.slice(0, 4000);
}

export async function parseOrderEmail(
  bodyHtml: string,
  source: "amazon" | "rakuten"
): Promise<ParsedOrder | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const text = extractRelevantContent(bodyHtml, source);

  if (text.length < 20) return null;

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "ECサイトの注文確認メールから購入情報を抽出。必ずJSON形式で返す。商品名は正確に、価格は数値で(カンマなし)。",
    messages: [
      {
        role: "user",
        content: `以下の${source}注文メールから情報抽出:\n${text}\n\nJSON: {items:[{title:string,price:number,quantity:number}],orderNumber:string,orderDate:string}`,
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
