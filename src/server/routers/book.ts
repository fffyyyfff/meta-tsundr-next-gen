import { router, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../../lib/prisma';
import {
  bookCreateInput,
  bookListInput,
  bookUpdateInput,
  bookChangeStatusInput,
} from './book.schemas';
import { lookupByIsbn } from '../services/isbn-lookup';
import { bookRecommendAgent } from '../agents/book-recommend-agent';
import { bookReviewAgent } from '../agents/book-review-agent';
import { readingPlanAgent } from '../agents/reading-plan-agent';

export const bookRouter = router({
  list: protectedProcedure
    .input(bookListInput)
    .query(async ({ ctx, input }) => {
      const { status, search, sortBy, sortOrder, limit, cursor } = input;

      const where = {
        userId: ctx.userId,
        deletedAt: null,
        ...(status && { status }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { author: { contains: search, mode: 'insensitive' as const } },
            { isbn: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const books = await prisma.book.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      const hasMore = books.length > limit;
      const items = hasMore ? books.slice(0, limit) : books;
      const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

      return { items, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const book = await prisma.book.findUnique({ where: { id: input.id } });
      if (!book || book.deletedAt || book.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      }
      return book;
    }),

  create: protectedProcedure
    .input(bookCreateInput)
    .mutation(async ({ ctx, input }) => {
      return prisma.book.create({
        data: {
          ...input,
          userId: ctx.userId,
          startedAt: input.status === 'READING' ? new Date() : null,
          finishedAt: input.status === 'FINISHED' ? new Date() : null,
        },
      });
    }),

  update: protectedProcedure
    .input(bookUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await prisma.book.findUnique({ where: { id } });
      if (!existing || existing.deletedAt || existing.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      }

      const updates: Record<string, unknown> = { ...data };

      if (data.status && data.status !== existing.status) {
        if (data.status === 'READING' && !existing.startedAt) {
          updates.startedAt = new Date();
        }
        if (data.status === 'FINISHED' && !existing.finishedAt) {
          updates.finishedAt = new Date();
        }
      }

      return prisma.book.update({ where: { id }, data: updates });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const book = await prisma.book.findUnique({ where: { id: input.id } });
      if (!book || book.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      }
      return prisma.book.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const book = await prisma.book.findUnique({ where: { id: input.id } });
      if (!book || book.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      }
      return prisma.book.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
    }),

  changeStatus: protectedProcedure
    .input(bookChangeStatusInput)
    .mutation(async ({ ctx, input }) => {
      const book = await prisma.book.findUnique({ where: { id: input.id } });
      if (!book || book.deletedAt || book.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      }

      const updates: Record<string, unknown> = { status: input.status };
      if (input.status === 'READING' && !book.startedAt) {
        updates.startedAt = new Date();
      }
      if (input.status === 'FINISHED' && !book.finishedAt) {
        updates.finishedAt = new Date();
      }

      return prisma.book.update({ where: { id: input.id }, data: updates });
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [statusCounts, addedThisMonth, finishedThisMonth] = await Promise.all([
      prisma.book.groupBy({
        by: ['status'],
        where: { userId: ctx.userId, deletedAt: null },
        _count: true,
      }),
      prisma.book.count({
        where: {
          userId: ctx.userId,
          deletedAt: null,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.book.count({
        where: {
          userId: ctx.userId,
          deletedAt: null,
          status: 'FINISHED',
          finishedAt: { gte: startOfMonth },
        },
      }),
    ]);

    const byStatus = {
      UNREAD: 0,
      READING: 0,
      FINISHED: 0,
    };
    for (const row of statusCounts) {
      byStatus[row.status] = row._count;
    }

    return {
      total: byStatus.UNREAD + byStatus.READING + byStatus.FINISHED,
      byStatus,
      addedThisMonth,
      finishedThisMonth,
    };
  }),

  readingAnalytics: protectedProcedure.query(async ({ ctx }) => {
    // Monthly added counts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentBooks = await prisma.book.findMany({
      where: {
        userId: ctx.userId,
        deletedAt: null,
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true },
    });

    const monthlyAdded: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyAdded[key] = 0;
    }
    for (const book of recentBooks) {
      const d = new Date(book.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyAdded) monthlyAdded[key]++;
    }

    const monthlyData = Object.entries(monthlyAdded)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Average reading duration (startedAt → finishedAt)
    const finishedBooks = await prisma.book.findMany({
      where: {
        userId: ctx.userId,
        deletedAt: null,
        status: 'FINISHED',
        startedAt: { not: null },
        finishedAt: { not: null },
      },
      select: { startedAt: true, finishedAt: true },
    });

    let avgReadingDays: number | null = null;
    if (finishedBooks.length > 0) {
      const totalDays = finishedBooks.reduce((sum, b) => {
        const days = (new Date(b.finishedAt!).getTime() - new Date(b.startedAt!).getTime()) / (1000 * 60 * 60 * 24);
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

  getAiRecommendation: protectedProcedure.mutation(async ({ ctx }) => {
    const finishedBooks = await prisma.book.findMany({
      where: { userId: ctx.userId, deletedAt: null, status: 'FINISHED' },
      select: { title: true, author: true },
      orderBy: { finishedAt: 'desc' },
      take: 30,
    });

    if (finishedBooks.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '推薦には読了済みの書籍が必要です',
      });
    }

    const bookList = finishedBooks
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

  generateReview: protectedProcedure
    .input(z.object({ bookId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const book = await prisma.book.findUnique({ where: { id: input.bookId } });
      if (!book || book.deletedAt || book.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      }

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

  createReadingPlan: protectedProcedure.mutation(async ({ ctx }) => {
    const unreadBooks = await prisma.book.findMany({
      where: { userId: ctx.userId, deletedAt: null, status: 'UNREAD' },
      select: { title: true, author: true },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    if (unreadBooks.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '読書プランには未読の書籍が必要です',
      });
    }

    const bookList = unreadBooks
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
});
