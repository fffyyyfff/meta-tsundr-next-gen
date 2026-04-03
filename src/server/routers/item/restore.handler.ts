import { prisma } from '@/shared/lib/prisma';
import { invalidateCache } from '../../services/cached-queries';
import type { z } from 'zod';
import type { restoreInput } from './schemas';

type RestoreInput = z.infer<typeof restoreInput>;

export async function restoreHandler({ input }: { input: RestoreInput }) {
  await prisma.item.update({
    where: { id: input.id },
    data: { deletedAt: null },
  });
  await invalidateCache('items:*');
  return { success: true };
}
