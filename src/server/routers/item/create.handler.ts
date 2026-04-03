import { prisma } from '@/shared/lib/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { invalidateCache } from '../../services/cached-queries';
import type { z } from 'zod';
import type { itemCreateInput } from './schemas';

type CreateInput = z.infer<typeof itemCreateInput>;

export async function createHandler({ input, ctx }: { input: CreateInput; ctx: { userId: string | null } }) {
  const userId = ctx.userId ?? 'dev-user';
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@localhost` },
  });

  const result = await prisma.item.create({
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
  await invalidateCache('items:*');
  return result;
}
