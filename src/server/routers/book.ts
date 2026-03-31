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

interface OpenLibraryBook {
  title?: string;
  authors?: Array<{ name: string }>;
  cover?: { small?: string; medium?: string; large?: string };
}

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

  lookupIsbn: publicProcedure
    .input(z.object({ isbn: z.string().min(10).max(13) }))
    .query(async ({ input }) => {
      const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(input.isbn)}&format=json&jscmd=data`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Open Library API error' });
      }

      const data = (await response.json()) as Record<string, OpenLibraryBook>;
      const entry = data[`ISBN:${input.isbn}`];
      if (!entry) {
        return null;
      }

      return {
        title: entry.title ?? null,
        author: entry.authors?.[0]?.name ?? null,
        coverUrl: entry.cover?.medium ?? entry.cover?.small ?? null,
      };
    }),
});
