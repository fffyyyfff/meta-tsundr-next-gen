import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';
import { appStatusToProtoStatus } from '../../grpc-client/converters';
import { withCache } from '../../services/cached-queries';
import type { bookListInput } from './schemas';

type ListInput = z.infer<typeof bookListInput>;

export async function listHandler({
  input,
  ctx,
}: {
  input: ListInput;
  ctx: { userId: string | null; token: string | null };
}) {
  const { status, search, sortBy, sortOrder, limit, cursor } = input;
  const userId = ctx.userId ?? 'all';
  const cacheKey = `books:list:${userId}:${status ?? 'all'}:${search ?? 'all'}:${sortBy}:${sortOrder}:${limit}:${cursor ?? 'none'}`;

  return withCache(cacheKey, 60, async () => {
    try {
      const res = await bookClient.getBooks(
        {
          status: status ? appStatusToProtoStatus(status) : undefined,
          search: search ?? undefined,
          sortBy,
          sortOrder,
          limit,
          cursor: cursor ?? undefined,
        },
        ctx.token ?? undefined,
      );

      return { items: res.books, nextCursor: res.nextCursor || undefined };
    } catch {
      // gRPC backend not available -- fallback to Prisma
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
}
