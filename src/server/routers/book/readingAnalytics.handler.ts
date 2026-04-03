import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';

export async function readingAnalyticsHandler({
  ctx,
}: {
  ctx: { userId: string | null; token: string | null };
}) {
  let books: Array<{
    status: string;
    createdAt: Date;
    startedAt?: Date | null;
    finishedAt?: Date | null;
  }> = [];
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

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyAdded: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyAdded[key] = 0;
  }
  for (const book of books) {
    if (book.createdAt < sixMonthsAgo) continue;
    const d = new Date(book.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthlyAdded) monthlyAdded[key]++;
  }

  const monthlyData = Object.entries(monthlyAdded)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const finishedBooks = books.filter(
    (b) => b.status === 'FINISHED' && b.startedAt && b.finishedAt,
  );

  let avgReadingDays: number | null = null;
  if (finishedBooks.length > 0) {
    const totalDays = finishedBooks.reduce((sum, b) => {
      const days =
        (new Date(b.finishedAt!).getTime() - new Date(b.startedAt!).getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + Math.max(0, days);
    }, 0);
    avgReadingDays = Math.round(totalDays / finishedBooks.length);
  }

  return { monthlyData, avgReadingDays };
}
