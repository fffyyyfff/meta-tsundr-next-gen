import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';
import { invalidateCache } from '../../services/cached-queries';
import type { bookCreateInput } from './schemas';

type CreateInput = z.infer<typeof bookCreateInput>;

export async function createHandler({
  input,
  ctx,
}: {
  input: CreateInput;
  ctx: { userId: string | null; token: string | null };
}) {
  let result;
  try {
    result = await bookClient.createBook(
      {
        title: input.title,
        author: input.author,
        isbn: input.isbn,
        status: input.status,
        imageUrl: input.imageUrl,
        notes: input.notes,
        rating: input.rating,
      },
      ctx.token ?? undefined,
    );
  } catch {
    // gRPC backend not available -- fallback to Prisma direct
    // Ensure dev user exists
    const userId = ctx.userId ?? 'dev-user';
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@localhost` },
    });

    result = await prisma.book.create({
      data: {
        title: input.title,
        author: input.author,
        isbn: input.isbn ?? null,
        status: input.status ?? 'UNREAD',
        imageUrl: input.imageUrl ?? null,
        notes: input.notes ?? null,
        rating: input.rating ?? null,
        userId,
      },
    });
  }
  await invalidateCache('books:*');
  return result;
}
