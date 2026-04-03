import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';
import { invalidateCache } from '../../services/cached-queries';
import type { bookChangeStatusInput } from './schemas';

type ChangeStatusInput = z.infer<typeof bookChangeStatusInput>;

export async function changeStatusHandler({
  input,
  ctx,
}: {
  input: ChangeStatusInput;
  ctx: { userId: string | null; token: string | null };
}) {
  let result;
  try {
    result = await bookClient.updateBookStatus(input.id, input.status, ctx.token ?? undefined);
  } catch {
    const data: Record<string, unknown> = { status: input.status as never };
    if (input.status === 'READING') data.startedAt = new Date();
    if (input.status === 'FINISHED') data.finishedAt = new Date();
    result = await prisma.book.update({ where: { id: input.id }, data });
  }
  await invalidateCache('books:*');
  return result;
}
