import { prisma } from "@/shared/lib/prisma";
import { syncBookDatabase } from "../../services/notion-mcp";

export async function notionSyncHandler({
  ctx,
}: {
  ctx: { userId: string | null };
}) {
  const userId = ctx.userId ?? "default-user";

  const books = await prisma.book.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const bookData = books.map((book) => ({
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
  }));

  return syncBookDatabase(bookData);
}
