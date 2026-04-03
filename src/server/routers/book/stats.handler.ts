import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';
import { withCache } from '../../services/cached-queries';

export async function statsHandler({
  ctx,
}: {
  ctx: { userId: string | null; token: string | null };
}) {
  const userId = ctx.userId ?? 'all';
  const cacheKey = `books:stats:${userId}`;

  return withCache(cacheKey, 300, async () => {
    let books: Array<{ status: string; createdAt: Date; finishedAt?: Date | null }> = [];
    try {
      const allBooks = await bookClient.getBooks({ limit: 1000 }, ctx.token ?? undefined);
      books = allBooks.books;
    } catch {
      try {
        books = await prisma.book.findMany({ where: { deletedAt: null } });
      } catch {
        /* DB not available */
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const byStatus: Record<string, number> = { UNREAD: 0, READING: 0, FINISHED: 0 };
    let addedThisMonth = 0;
    let finishedThisMonth = 0;

    for (const book of books) {
      byStatus[book.status] = (byStatus[book.status] ?? 0) + 1;
      if (book.createdAt >= startOfMonth) addedThisMonth++;
      if (book.status === 'FINISHED' && book.finishedAt && book.finishedAt >= startOfMonth) {
        finishedThisMonth++;
      }
    }

    return {
      total: byStatus.UNREAD + byStatus.READING + byStatus.FINISHED,
      byStatus,
      addedThisMonth,
      finishedThisMonth,
    };
  });
}
