import { router, publicProcedure } from '../trpc';
import { prisma } from '@/shared/lib/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  bookCreateInput,
  bookListInput,
  bookUpdateInput,
  bookChangeStatusInput,
} from './book.schemas';
import { bookClient } from '../grpc-client';
import { appStatusToProtoStatus } from '../grpc-client/converters';
import { BookStatus as ProtoBookStatus } from '@/generated/proto/tsundoku/book/v1/types';
import { lookupByIsbn } from '../services/isbn-lookup';
import { searchByTitle } from '../services/rakuten-books';
import { withCache, invalidateCache } from '../services/cached-queries';
import { bookRecommendAgent } from '../agents/book-recommend-agent';
import { bookReviewAgent } from '../agents/book-review-agent';
import { readingPlanAgent } from '../agents/reading-plan-agent';

export const bookRouter = router({
  list: publicProcedure
    .input(bookListInput)
    .query(async ({ input, ctx }) => {
      const { status, search, sortBy, sortOrder, limit, cursor } = input;
      const userId = ctx.userId ?? 'all';
      const cacheKey = `books:list:${userId}:${status ?? 'all'}:${search ?? 'all'}:${sortBy}:${sortOrder}:${limit}:${cursor ?? 'none'}`;

      return withCache(cacheKey, 60, async () => {
        try {
          const res = await bookClient.getBooks({
            status: status ? appStatusToProtoStatus(status) : undefined,
            search: search ?? undefined,
            sortBy,
            sortOrder,
            limit,
            cursor: cursor ?? undefined,
          }, ctx.token ?? undefined);

          return { items: res.books, nextCursor: res.nextCursor || undefined };
        } catch {
          // gRPC backend not available — fallback to Prisma
          try {
            const where: Record<string, unknown> = { deletedAt: null };
            if (ctx.userId) where.userId = ctx.userId;
            if (status) where.status = status;
            if (search) {
              where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
              ];
            }
            const books = await prisma.book.findMany({
              where,
              orderBy: { [sortBy]: sortOrder },
              take: limit + 1,
              ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            });
            const hasMore = books.length > limit;
            const items = hasMore ? books.slice(0, limit) : books;
            return { items, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
          } catch {
            return { items: [], nextCursor: undefined };
          }
        }
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return await bookClient.getBook(input.id, ctx.token ?? undefined);
      } catch {
        // gRPC fallback to Prisma
        const book = await prisma.book.findFirst({
          where: { id: input.id, deletedAt: null },
        });
        if (!book) throw new TRPCError({ code: 'NOT_FOUND', message: '書籍が見つかりません' });
        return book;
      }
    }),

  create: publicProcedure
    .input(bookCreateInput)
    .mutation(async ({ input, ctx }) => {
      let result;
      try {
        result = await bookClient.createBook({
          title: input.title,
          author: input.author,
          isbn: input.isbn,
          status: input.status,
          imageUrl: input.imageUrl,
          notes: input.notes,
          rating: input.rating,
        }, ctx.token ?? undefined);
      } catch {
        // gRPC backend not available — fallback to Prisma direct
        // Ensure dev user exists
        const userId = ctx.userId ?? 'dev-user';
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: { id: userId, email: `${userId}@localhost` },
        });

        result = await prisma.book.create({
          data: {
            title: input.title,
            author: input.author,
            isbn: input.isbn ?? null,
            status: input.status ?? 'UNREAD',
            imageUrl: input.imageUrl ?? null,
            notes: input.notes ?? null,
            rating: input.rating ?? null,
            userId,
          },
        });
      }
      await invalidateCache('books:*');
      return result;
    }),

  update: publicProcedure
    .input(bookUpdateInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      let result;
      try {
        result = await bookClient.updateBook({
          id,
          title: data.title,
          author: data.author,
          isbn: data.isbn,
          status: data.status,
          imageUrl: data.imageUrl,
          notes: data.notes,
          rating: data.rating ?? undefined,
        }, ctx.token ?? undefined);
      } catch {
        result = await prisma.book.update({
          where: { id },
          data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.author !== undefined && { author: data.author }),
            ...(data.isbn !== undefined && { isbn: data.isbn }),
            ...(data.status !== undefined && { status: data.status as never }),
            ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.rating !== undefined && { rating: data.rating }),
          },
        });
      }
      await invalidateCache('books:*');
      return result;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await bookClient.deleteBook(input.id, ctx.token ?? undefined);
      } catch {
        await prisma.book.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
      }
      await invalidateCache('books:*');
      return { success: true };
    }),

  restore: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookClient.updateBook({ id: input.id }, ctx.token ?? undefined);
      } catch {
        return prisma.book.update({ where: { id: input.id }, data: { deletedAt: null } });
      }
    }),

  changeStatus: publicProcedure
    .input(bookChangeStatusInput)
    .mutation(async ({ input, ctx }) => {
      let result;
      try {
        result = await bookClient.updateBookStatus(input.id, input.status, ctx.token ?? undefined);
      } catch {
        const data: Record<string, unknown> = { status: input.status as never };
        if (input.status === 'READING') data.startedAt = new Date();
        if (input.status === 'FINISHED') data.finishedAt = new Date();
        result = await prisma.book.update({ where: { id: input.id }, data });
      }
      await invalidateCache('books:*');
      return result;
    }),

  stats: publicProcedure.query(async ({ ctx }) => {
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
        } catch { /* DB not available */ }
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
  }),

  readingAnalytics: publicProcedure.query(async ({ ctx }) => {
    let books: Array<{ status: string; createdAt: Date; startedAt?: Date | null; finishedAt?: Date | null }> = [];
    try {
      const allBooks = await bookClient.getBooks({ limit: 1000 }, ctx.token ?? undefined);
      books = allBooks.books;
    } catch {
      try {
        books = await prisma.book.findMany({ where: { deletedAt: null } });
      } catch { /* DB not available */ }
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
  }),

  lookupIsbn: publicProcedure
    .input(z.object({ isbn: z.string().min(10).max(13) }))
    .query(async ({ input }) => {
      const result = await lookupByIsbn(input.isbn);
      if (!result) return null;
      return {
        title: result.title,
        author: result.author,
        coverUrl: result.imageUrl,
      };
    }),

  getAiRecommendation: publicProcedure.mutation(async ({ ctx }) => {
    const res = await bookClient.getBooks({
      status: ProtoBookStatus.FINISHED,
      limit: 30,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, ctx.token ?? undefined);

    if (res.books.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '推薦には読了済みの書籍が必要です',
      });
    }

    const bookList = res.books
      .map((b) => `- 「${b.title}」${b.author}`)
      .join('\n');

    const result = await bookRecommendAgent.execute(
      `以下はユーザーの読書履歴です。この傾向を分析して、次に読むべき本を3〜5冊推薦してください。\n\n${bookList}`,
    );

    if (!result.success) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: result.error ?? 'AI推薦の生成に失敗しました',
      });
    }

    return { recommendation: result.result, tokenUsage: result.tokenUsage };
  }),

  generateReview: publicProcedure
    .input(z.object({ bookId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const book = await bookClient.getBook(input.bookId, ctx.token ?? undefined);

      const prompt = [
        `書籍情報:`,
        `- タイトル: ${book.title}`,
        `- 著者: ${book.author}`,
        book.notes ? `\nユーザーのメモ:\n${book.notes}` : '',
        `\nこの書籍の書評を生成してください。`,
      ]
        .filter(Boolean)
        .join('\n');

      const result = await bookReviewAgent.execute(prompt);

      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error ?? '書評の生成に失敗しました',
        });
      }

      return { review: result.result, tokenUsage: result.tokenUsage };
    }),

  createReadingPlan: publicProcedure.mutation(async ({ ctx }) => {
    const res = await bookClient.getBooks({
      status: ProtoBookStatus.UNREAD,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    }, ctx.token ?? undefined);

    if (res.books.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '読書プランには未読の書籍が必要です',
      });
    }

    const bookList = res.books
      .map((b) => `- 「${b.title}」${b.author}`)
      .join('\n');

    const result = await readingPlanAgent.execute(
      `以下はユーザーの積読リストです。これらの書籍を使って1週間の読書スケジュールを作成してください。\n\n${bookList}`,
    );

    if (!result.success) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: result.error ?? '読書プランの生成に失敗しました',
      });
    }

    return { plan: result.result, tokenUsage: result.tokenUsage };
  }),

  searchExternal: publicProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      availability: z.string().optional(),
      sort: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const results = await searchByTitle(input.title, 10, {
        availability: input.availability,
        sort: input.sort,
      });
      return results.map((r) => ({
        title: r.title,
        author: r.author,
        isbn: r.isbn,
        imageUrl: r.imageUrl,
        publisher: r.publisher,
        description: r.description,
        salesDate: r.salesDate,
        availability: r.availability,
      }));
    }),
});
