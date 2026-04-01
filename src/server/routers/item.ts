import { router, publicProcedure } from '../trpc';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import { itemCreateInput, itemListInput, itemUpdateInput } from './item.schemas';

export const itemRouter = router({
  list: publicProcedure
    .input(itemListInput)
    .query(async ({ input, ctx }) => {
      const { category, status, search, sortBy, sortOrder, limit, cursor } = input;

      try {
        const where: Record<string, unknown> = { deletedAt: null };
        if (ctx.userId) where.userId = ctx.userId;
        if (category) where.category = category;
        if (status) where.status = status;
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
      if (!item) throw new Error('アイテムが見つかりません');
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
          source: input.source ?? null,
          notes: input.notes ?? null,
          rating: input.rating ?? null,
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
          ...(data.source !== undefined && { source: data.source }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.rating !== undefined && { rating: data.rating }),
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
          // Amazon API unavailable — fall through to Rakuten
        }
      }

      // 楽天にフォールバック（or 直接指定）
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
    }),

  stats: publicProcedure.query(async ({ ctx }) => {
    try {
      const where: Record<string, unknown> = { deletedAt: null };
      if (ctx.userId) where.userId = ctx.userId;

      const items = await prisma.item.findMany({ where });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const byStatus: Record<string, number> = {
        WISHLIST: 0, PURCHASED: 0, IN_USE: 0, COMPLETED: 0, RETURNED: 0,
      };
      const byCategory: Record<string, number> = {};
      let addedThisMonth = 0;

      for (const item of items) {
        byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
        byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
        if (item.createdAt >= startOfMonth) addedThisMonth++;
      }

      return { total: items.length, byStatus, byCategory, addedThisMonth };
    } catch {
      return { total: 0, byStatus: {}, byCategory: {}, addedThisMonth: 0 };
    }
  }),
});
