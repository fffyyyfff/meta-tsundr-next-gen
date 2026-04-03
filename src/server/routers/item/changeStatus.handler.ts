import { prisma } from '@/shared/lib/prisma';
import { invalidateCache } from '../../services/cached-queries';
import type { z } from 'zod';
import type { itemChangeStatusInput } from './schemas';

type ChangeStatusInput = z.infer<typeof itemChangeStatusInput>;

export async function changeStatusHandler({ input }: { input: ChangeStatusInput }) {
  const result = await prisma.item.update({
    where: { id: input.id },
    data: { status: input.status },
  });
  await invalidateCache('items:*');
  return result;
}
