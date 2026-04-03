import Anthropic from '@anthropic-ai/sdk';

export interface ParsedOrder {
  items: Array<{ title: string; price: number; quantity: number }>;
  orderNumber: string;
  orderDate: string;
}

export async function parseOrderEmail(
  bodyHtml: string,
  source: 'amazon' | 'rakuten',
): Promise<ParsedOrder | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  // Strip HTML tags and truncate
  const text = bodyHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);

  if (text.length < 20) return null;

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1024,
      system:
        'ECサイトの注文確認メールから購入情報を抽出するアシスタントです。必ず有効なJSON形式で返してください。余計なテキストは含めないでください。',
      messages: [
        {
          role: 'user',
          content: `以下の${source === 'amazon' ? 'Amazon' : '楽天市場'}の注文確認メールから購入情報を抽出してください。

メール本文:
${text}

以下のJSON形式で返してください:
{"items":[{"title":"商品名","price":1234,"quantity":1}],"orderNumber":"注文番号","orderDate":"YYYY-MM-DD"}`,
        },
      ],
    });

    const content = msg.content[0];
    if (content.type !== 'text') return null;

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    return JSON.parse(match[0]) as ParsedOrder;
  } catch {
    return null;
  }
}
