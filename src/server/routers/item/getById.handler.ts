import { prisma } from '@/shared/lib/prisma';
import { TRPCError } from '@trpc/server';
import type { z } from 'zod';
import type { getByIdInput } from './schemas';

type GetByIdInput = z.infer<typeof getByIdInput>;

export async function getByIdHandler({ input }: { input: GetByIdInput }) {
  const item = await prisma.item.findUnique({ where: { id: input.id } });
  if (!item) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'アイテムが見つかりません' });
  }
  return item;
}
