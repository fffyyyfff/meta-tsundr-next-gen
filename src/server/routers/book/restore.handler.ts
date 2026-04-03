import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';

export async function restoreHandler({
  input,
  ctx,
}: {
  input: { id: string };
  ctx: { userId: string | null; token: string | null };
}) {
  try {
    return await bookClient.updateBook({ id: input.id }, ctx.token ?? undefined);
  } catch {
    return prisma.book.update({ where: { id: input.id }, data: { deletedAt: null } });
  }
}
