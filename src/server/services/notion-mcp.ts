import { Client } from "@notionhq/client";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger("notion-mcp");

interface BookData {
  id: string;
  title: string;
  author: string;
  status: string;
  rating: number | null;
  isbn: string | null;
  imageUrl: string | null;
  notes: string | null;
  finishedAt: Date | string | null;
  createdAt: Date | string | null;
}

interface NotionPageResult {
  pageId: string;
  url: string;
}

function getNotionClient(): Client | null {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return null;
  return new Client({ auth: apiKey });
}

async function generateReadingNote(book: BookData): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return `# ${book.title}\n\n著者: ${book.author}\n\n読書ノートをここに記入してください。`;
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `以下の書籍の読書ノートテンプレートを日本語で生成してください。

書籍: ${book.title}
著者: ${book.author}
${book.rating ? `評価: ${"★".repeat(book.rating)}${"☆".repeat(5 - book.rating)}` : ""}
${book.notes ? `既存メモ: ${book.notes}` : ""}

以下の構成で:
1. 概要（2-3文）
2. 感想
3. 印象的な箇所
4. おすすめ度と理由

Markdown形式で返してください。`,
      },
    ],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "";
}

export async function createReadingNote(
  book: BookData
): Promise<NotionPageResult | null> {
  const notion = getNotionClient();
  if (!notion) {
    log.info("Notion API key not configured, skipping");
    return null;
  }

  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    log.warn("NOTION_DATABASE_ID not set");
    return null;
  }

  try {
    const noteContent = await generateReadingNote(book);

    const pageProperties: Record<string, unknown> = {
      Name: {
        title: [{ text: { content: `📚 ${book.title} - 読書ノート` } }],
      },
      Author: {
        rich_text: [{ text: { content: book.author } }],
      },
      Status: {
        select: { name: book.status },
      },
    };

    if (book.rating) {
      pageProperties.Rating = { number: book.rating };
    }

    if (book.finishedAt) {
      pageProperties["Finished Date"] = {
        date: {
          start: new Date(book.finishedAt).toISOString().split("T")[0],
        },
      };
    }

    if (book.isbn) {
      pageProperties.ISBN = {
        rich_text: [{ text: { content: book.isbn } }],
      };
    }

    const children = noteContent.split("\n").map((line) => {
      if (line.startsWith("# ")) {
        return {
          object: "block" as const,
          type: "heading_1" as const,
          heading_1: {
            rich_text: [{ type: "text" as const, text: { content: line.slice(2) } }],
          },
        };
      }
      if (line.startsWith("## ")) {
        return {
          object: "block" as const,
          type: "heading_2" as const,
          heading_2: {
            rich_text: [{ type: "text" as const, text: { content: line.slice(3) } }],
          },
        };
      }
      if (line.startsWith("### ")) {
        return {
          object: "block" as const,
          type: "heading_3" as const,
          heading_3: {
            rich_text: [{ type: "text" as const, text: { content: line.slice(4) } }],
          },
        };
      }
      return {
        object: "block" as const,
        type: "paragraph" as const,
        paragraph: {
          rich_text: [{ type: "text" as const, text: { content: line } }],
        },
      };
    });

    const createParams: Record<string, unknown> = {
      parent: { database_id: databaseId },
      properties: pageProperties,
      children,
    };

    if (book.imageUrl) {
      createParams.cover = {
        type: "external",
        external: { url: book.imageUrl },
      };
    }

    const page = await notion.pages.create(createParams as Parameters<typeof notion.pages.create>[0]);

    const url = "url" in page ? (page.url as string) : "";
    log.info("Reading note created", { pageId: page.id, title: book.title });

    return { pageId: page.id, url };
  } catch (err) {
    log.error("Failed to create reading note", {
      error: err instanceof Error ? err.message : String(err),
      bookId: book.id,
    });
    return null;
  }
}

export async function syncBookDatabase(
  books: BookData[]
): Promise<{ synced: number; errors: number }> {
  const notion = getNotionClient();
  if (!notion) {
    log.info("Notion API key not configured, skipping sync");
    return { synced: 0, errors: 0 };
  }

  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    log.warn("NOTION_DATABASE_ID not set");
    return { synced: 0, errors: 0 };
  }

  let synced = 0;
  let errors = 0;

  for (const book of books) {
    try {
      // Search for existing page by title
      const existing = await (notion as unknown as { databases: { query: (args: Record<string, unknown>) => Promise<{ results: Array<{ id: string }> }> } }).databases.query({
        database_id: databaseId,
        filter: {
          property: "Name",
          title: { contains: book.title },
        },
        page_size: 1,
      });

      const properties: Parameters<typeof notion.pages.create>[0]["properties"] = {
        Name: {
          title: [{ text: { content: `📚 ${book.title}` } }],
        },
        Author: {
          rich_text: [{ text: { content: book.author } }],
        },
        Status: {
          select: { name: book.status },
        },
      };

      if (book.rating) {
        properties.Rating = { number: book.rating };
      }

      if (existing.results.length > 0) {
        await notion.pages.update({
          page_id: existing.results[0].id,
          properties: properties as Parameters<typeof notion.pages.update>[0]["properties"],
        });
      } else {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties,
          ...(book.imageUrl && {
            cover: { type: "external" as const, external: { url: book.imageUrl } },
          }),
        });
      }

      synced++;
    } catch {
      errors++;
    }
  }

  log.info("Book database sync completed", { synced, errors, total: books.length });
  return { synced, errors };
}
