import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';
import { invalidateCache } from '../../services/cached-queries';
import type { bookUpdateInput } from './schemas';

type UpdateInput = z.infer<typeof bookUpdateInput>;

export async function updateHandler({
  input,
  ctx,
}: {
  input: UpdateInput;
  ctx: { userId: string | null; token: string | null };
}) {
  const { id, ...data } = input;
  let result;
  try {
    result = await bookClient.updateBook(
      {
        id,
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        status: data.status,
        imageUrl: data.imageUrl,
        notes: data.notes,
        rating: data.rating ?? undefined,
      },
      ctx.token ?? undefined,
    );
  } catch {
    result = await prisma.book.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.author !== undefined && { author: data.author }),
        ...(data.isbn !== undefined && { isbn: data.isbn }),
        ...(data.status !== undefined && { status: data.status as never }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.rating !== undefined && { rating: data.rating }),
      },
    });
  }
  await invalidateCache('books:*');
  return result;
}
