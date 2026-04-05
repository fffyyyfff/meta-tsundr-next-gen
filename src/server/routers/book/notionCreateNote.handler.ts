import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { createReadingNote } from "../../services/notion-mcp";

export const notionCreateNoteInput = z.object({
  bookId: z.string(),
});

type NotionCreateNoteInput = z.infer<typeof notionCreateNoteInput>;

export async function notionCreateNoteHandler({
  input,
}: {
  input: NotionCreateNoteInput;
}) {
  const book = await prisma.book.findUnique({
    where: { id: input.bookId },
  });

  if (!book) {
    return { success: false, url: null, error: "書籍が見つかりません" };
  }

  const result = await createReadingNote({
    id: book.id,
    title: book.title,
    author: book.author,
    status: book.status,
    rating: book.rating,
    isbn: book.isbn,
    imageUrl: book.imageUrl,
    notes: book.notes,
    finishedAt: book.finishedAt,
    createdAt: book.createdAt,
  });

  if (!result) {
    return {
      success: false,
      url: null,
      error: "Notion連携が設定されていません。NOTION_API_KEYとNOTION_DATABASE_IDを確認してください。",
    };
  }

  return { success: true, url: result.url, error: null };
}
