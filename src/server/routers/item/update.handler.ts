import { prisma } from '@/shared/lib/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { invalidateCache } from '../../services/cached-queries';
import type { z } from 'zod';
import type { itemUpdateInput } from './schemas';

type UpdateInput = z.infer<typeof itemUpdateInput>;

export async function updateHandler({ input }: { input: UpdateInput }) {
  const { id, ...data } = input;
  const result = await prisma.item.update({
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
  await invalidateCache('items:*');
  return result;
}
