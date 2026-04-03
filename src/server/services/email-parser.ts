import Anthropic from "@anthropic-ai/sdk";

interface ParsedOrder {
  items: Array<{ title: string; price: number; quantity: number }>;
  orderNumber: string;
  orderDate: string;
}

export async function parseOrderEmail(
  bodyHtml: string,
  source: "amazon" | "rakuten"
): Promise<ParsedOrder | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const text = bodyHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    system:
      "ECサイトの注文確認メールから購入情報を抽出。必ずJSON形式で返す。",
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
