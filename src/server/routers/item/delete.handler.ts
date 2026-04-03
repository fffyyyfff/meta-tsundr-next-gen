import { prisma } from '@/shared/lib/prisma';
import { invalidateCache } from '../../services/cached-queries';
import type { z } from 'zod';
import type { deleteInput } from './schemas';

type DeleteInput = z.infer<typeof deleteInput>;

export async function deleteHandler({ input }: { input: DeleteInput }) {
  await prisma.item.update({
    where: { id: input.id },
    data: { deletedAt: new Date() },
  });
  await invalidateCache('items:*');
  return { success: true };
}
