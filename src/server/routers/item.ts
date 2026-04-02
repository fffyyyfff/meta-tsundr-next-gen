import { router, publicProcedure } from '../trpc';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '../../generated/prisma/client';
import {
  itemCreateInput,
  itemListInput,
  itemUpdateInput,
  itemChangeStatusInput,
} from './item.schemas';

export const itemRouter = router({
  list: publicProcedure
    .input(itemListInput)
    .query(async ({ input, ctx }) => {
      const { category, status, source, search, sortBy, sortOrder, limit, cursor } = input;

      try {
        const where: Record<string, unknown> = { deletedAt: null };
        if (ctx.userId) where.userId = ctx.userId;
        if (category) where.category = category;
        if (status) where.status = status;
        if (source) where.source = source;
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { creator: { contains: search, mode: 'insensitive' } },
          ];
        }
        const items = await prisma.item.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        const hasMore = items.length > limit;
        const result = hasMore ? items.slice(0, limit) : items;
        return { items: result, nextCursor: hasMore ? result[result.length - 1]?.id : undefined };
      } catch {
        return { items: [], nextCursor: undefined };
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await prisma.item.findUnique({ where: { id: input.id } });
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'アイテムが見つかりません' });
      }
      return item;
    }),

  create: publicProcedure
    .input(itemCreateInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId ?? 'dev-user';
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, email: `${userId}@localhost` },
      });

      return prisma.item.create({
        data: {
          category: input.category,
          title: input.title,
          creator: input.creator ?? null,
          externalId: input.externalId ?? null,
          status: input.status ?? 'PURCHASED',
          imageUrl: input.imageUrl ?? null,
          price: input.price ?? null,
          purchaseDate: input.purchaseDate ?? null,
          source: input.source ?? null,
          productUrl: input.productUrl ?? null,
          notes: input.notes ?? null,
          rating: input.rating ?? null,
          metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
          userId,
        },
      });
    }),

  update: publicProcedure
    .input(itemUpdateInput)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.item.update({
        where: { id },
        data: {
          ...(data.category !== undefined && { category: data.category }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.creator !== undefined && { creator: data.creator }),
          ...(data.externalId !== undefined && { externalId: data.externalId }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.purchaseDate !== undefined && { purchaseDate: data.purchaseDate }),
          ...(data.source !== undefined && { source: data.source }),
          ...(data.productUrl !== undefined && { productUrl: data.productUrl }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.rating !== undefined && { rating: data.rating }),
          ...(data.metadata !== undefined && {
            metadata: data.metadata === null
              ? Prisma.DbNull
              : (data.metadata as Prisma.InputJsonValue),
          }),
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.item.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
      return { success: true };
    }),

  restore: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.item.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
      return { success: true };
    }),

  changeStatus: publicProcedure
    .input(itemChangeStatusInput)
    .mutation(async ({ input }) => {
      return prisma.item.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  stats: publicProcedure.query(async ({ ctx }) => {
    try {
      const where: Record<string, unknown> = { deletedAt: null };
      if (ctx.userId) where.userId = ctx.userId;

      const items = await prisma.item.findMany({ where });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // byCategory: count + total price per category
      const byCategory: Record<string, { count: number; totalPrice: number }> = {};
      // byStatus: count per status
      const byStatus: Record<string, number> = {
        WISHLIST: 0, PURCHASED: 0, IN_USE: 0, COMPLETED: 0, RETURNED: 0,
      };
      // bySource: count per source
      const bySource: Record<string, number> = {};

      let totalSpending = 0;
      let thisMonthSpending = 0;
      let lastMonthSpending = 0;

      // monthly buckets for last 6 months
      const monthlyBuckets: Record<string, number> = {};
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyBuckets[key] = 0;
      }

      // byMonth: monthly spending (all time)
      const byMonth: Record<string, number> = {};

      for (const item of items) {
        // byStatus
        byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;

        // byCategory
        if (!byCategory[item.category]) {
          byCategory[item.category] = { count: 0, totalPrice: 0 };
        }
        byCategory[item.category].count += 1;
        byCategory[item.category].totalPrice += item.price ?? 0;

        // bySource
        const src = item.source ?? 'unknown';
        bySource[src] = (bySource[src] ?? 0) + 1;

        // spending calculations based on purchaseDate or createdAt
        const priceVal = item.price ?? 0;
        const dateRef = item.purchaseDate ?? item.createdAt;

        totalSpending += priceVal;

        if (dateRef >= startOfMonth) {
          thisMonthSpending += priceVal;
        } else if (dateRef >= startOfLastMonth && dateRef < startOfMonth) {
          lastMonthSpending += priceVal;
        }

        // byMonth
        const monthKey = `${dateRef.getFullYear()}-${String(dateRef.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthKey] = (byMonth[monthKey] ?? 0) + priceVal;

        // monthly buckets (last 6 months)
        if (monthKey in monthlyBuckets) {
          monthlyBuckets[monthKey] += priceVal;
        }
      }

      const monthlySpending = Object.entries(monthlyBuckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }));

      return {
        byCategory,
        byStatus,
        byMonth,
        bySource,
        totalSpending,
        thisMonthSpending,
        lastMonthSpending,
        monthlySpending,
      };
    } catch {
      return {
        byCategory: {},
        byStatus: {},
        byMonth: {},
        bySource: {},
        totalSpending: 0,
        thisMonthSpending: 0,
        lastMonthSpending: 0,
        monthlySpending: [],
      };
    }
  }),

  searchProduct: publicProcedure
    .input(z.object({
      keyword: z.string().min(1).max(200),
      source: z.enum(['amazon', 'rakuten', 'auto']).default('auto'),
    }))
    .query(async ({ input }) => {
      type ProductResult = {
        title: string;
        creator: string;
        externalId: string;
        imageUrl: string | null;
        price: number;
        productUrl: string;
        description: string;
        source: 'amazon' | 'rakuten';
      };

      // Amazon を試行
      if (input.source === 'amazon' || input.source === 'auto') {
        try {
          const { searchByKeyword: amazonSearch } = await import('../services/amazon-paapi');
          const amazonResults = await amazonSearch(input.keyword, 10);
          if (amazonResults.length > 0) {
            return amazonResults.map((r): ProductResult => ({
              title: r.title,
              creator: r.creator,
              externalId: r.externalId,
              imageUrl: r.imageUrl,
              price: r.price,
              productUrl: r.productUrl,
              description: r.description,
              source: 'amazon',
            }));
          }
        } catch {
          // Amazon API unavailable
        }

        // Amazon を明示指定した場合はフォールバックしない
        if (input.source === 'amazon') {
          return [];
        }
      }

      // 楽天（auto のフォールバック or 楽天直接指定）
      if (input.source === 'rakuten' || input.source === 'auto') {
        const { searchByKeyword: rakutenSearch } = await import('../services/rakuten-ichiba');
        const results = await rakutenSearch(input.keyword, 10);
        return results.map((r): ProductResult => ({
          title: r.title,
          creator: r.creator,
          externalId: r.externalId,
          imageUrl: r.imageUrl,
          price: r.price,
          productUrl: r.productUrl,
          description: r.description,
          source: 'rakuten',
        }));
      }

      return [];
    }),
});
