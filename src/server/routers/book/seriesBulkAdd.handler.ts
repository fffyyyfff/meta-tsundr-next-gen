import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { invalidateCache } from '../../services/cached-queries';
import type { seriesBulkAddInput } from './schemas';

type SeriesBulkAddInput = z.infer<typeof seriesBulkAddInput>;

export async function seriesBulkAddHandler({
  input,
  ctx,
}: {
  input: SeriesBulkAddInput;
  ctx: { userId: string | null; token: string | null };
}) {
  const userId = ctx.userId ?? 'dev-user';

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@localhost` },
  });

  let added = 0;
  let skipped = 0;

  for (const vol of input.volumes) {
    // Check duplicates by ISBN
    if (vol.isbn) {
      const existing = await prisma.book.findFirst({
        where: { userId, isbn: vol.isbn, deletedAt: null },
      });
      if (existing) {
        skipped++;
        continue;
      }
    }

    await prisma.book.create({
      data: {
        userId,
        title: vol.title,
        author: input.author,
        isbn: vol.isbn || null,
        imageUrl: vol.imageUrl,
        status: input.status,
        notes: `シリーズ: ${input.series}`,
      },
    });
    added++;
  }

  await invalidateCache('books:*');

  return { added, skipped };
}
