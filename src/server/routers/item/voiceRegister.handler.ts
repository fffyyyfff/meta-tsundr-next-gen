import Anthropic from "@anthropic-ai/sdk";
import { searchByKeyword } from "../../services/rakuten-ichiba";

interface VoiceRegisterInput {
  transcript: string;
}

type ItemCategory =
  | "BOOK"
  | "ELECTRONICS"
  | "DAILY_GOODS"
  | "FOOD"
  | "CLOTHING"
  | "HOBBY"
  | "OTHER";

interface VoiceParseResult {
  title: string;
  category: ItemCategory;
  imageUrl: string | null;
  price: number | null;
  source: string | null;
  error: string | null;
}

const VALID_CATEGORIES: ItemCategory[] = [
  "BOOK",
  "ELECTRONICS",
  "DAILY_GOODS",
  "FOOD",
  "CLOTHING",
  "HOBBY",
  "OTHER",
];

export async function voiceRegisterHandler({
  input,
}: {
  input: VoiceRegisterInput;
}): Promise<VoiceParseResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      title: input.transcript,
      category: "OTHER",
      imageUrl: null,
      price: null,
      source: null,
      error: "AI解析が利用できません",
    };
  }

  const client = new Anthropic();

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system:
      "音声入力から登録したい商品を解釈してJSON形式で返す。JSON以外のテキストは返さないこと。",
    messages: [
      {
        role: "user",
        content: `以下の音声入力から登録商品を解釈:\n「${input.transcript}」\n\nJSON: {"title":"正式な商品名","category":"BOOK|ELECTRONICS|DAILY_GOODS|FOOD|CLOTHING|HOBBY|OTHER","action":"add"}\n\n例:\n「リーダブルコード追加して」→{"title":"リーダブルコード","category":"BOOK","action":"add"}\n「iPhone充電器買った」→{"title":"iPhone充電器","category":"ELECTRONICS","action":"add"}\n「洗剤なくなった」→{"title":"洗剤","category":"DAILY_GOODS","action":"add"}`,
      },
    ],
  });

  const content = msg.content[0];
  if (content.type !== "text") {
    return {
      title: input.transcript,
      category: "OTHER",
      imageUrl: null,
      price: null,
      source: null,
      error: "解析結果を取得できませんでした",
    };
  }

  let title = input.transcript;
  let category: ItemCategory = "OTHER";

  try {
    const match = content.text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as {
        title?: string;
        category?: string;
      };
      if (parsed.title) title = parsed.title;
      if (parsed.category && VALID_CATEGORIES.includes(parsed.category as ItemCategory)) {
        category = parsed.category as ItemCategory;
      }
    }
  } catch {
    // Use defaults
  }

  // Search for product image and price
  let imageUrl: string | null = null;
  let price: number | null = null;
  let source: string | null = null;

  const results = await searchByKeyword(title, 1);
  if (results.length > 0) {
    imageUrl = results[0].imageUrl;
    price = results[0].price || null;
    source = "rakuten";
  }

  return { title, category, imageUrl, price, source, error: null };
}
