import { prisma } from '@/shared/lib/prisma';
import { TRPCError } from '@trpc/server';
import { bookClient } from '../../grpc-client';

export async function getByIdHandler({
  input,
  ctx,
}: {
  input: { id: string };
  ctx: { userId: string | null; token: string | null };
}) {
  try {
    return await bookClient.getBook(input.id, ctx.token ?? undefined);
  } catch {
    // gRPC fallback to Prisma
    const book = await prisma.book.findFirst({
      where: { id: input.id, deletedAt: null },
    });
    if (!book) throw new TRPCError({ code: 'NOT_FOUND', message: '書籍が見つかりません' });
    return book;
  }
}
