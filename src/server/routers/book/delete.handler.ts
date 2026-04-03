import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';
import { invalidateCache } from '../../services/cached-queries';

export async function deleteHandler({
  input,
  ctx,
}: {
  input: { id: string };
  ctx: { userId: string | null; token: string | null };
}) {
  try {
    await bookClient.deleteBook(input.id, ctx.token ?? undefined);
  } catch {
    await prisma.book.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
  }
  await invalidateCache('books:*');
  return { success: true };
}
