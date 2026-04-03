import { prisma } from '@/shared/lib/prisma';
import { withCache } from '../../services/cached-queries';
import type { z } from 'zod';
import type { itemListInput } from './schemas';

type ListInput = z.infer<typeof itemListInput>;

export async function listHandler({ input, ctx }: { input: ListInput; ctx: { userId: string | null } }) {
  const { category, status, source, search, sortBy, sortOrder, limit, cursor } = input;
  const userId = ctx.userId ?? 'all';
  const cacheKey = `items:list:${userId}:${category ?? 'all'}:${status ?? 'all'}:${source ?? 'all'}:${search ?? 'all'}:${sortBy}:${sortOrder}:${limit}:${cursor ?? 'none'}`;

  return withCache(cacheKey, 60, async () => {
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
  });
}
