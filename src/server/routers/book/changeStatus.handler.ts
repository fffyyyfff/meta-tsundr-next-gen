import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { bookClient } from '../../grpc-client';
import { invalidateCache } from '../../services/cached-queries';
import { createReadingNote } from '../../services/notion-mcp';
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

  // Create Notion reading note when book is marked as finished
  if (input.status === 'FINISHED') {
    const book = await prisma.book.findUnique({ where: { id: input.id } });
    if (book) {
      createReadingNote({
        id: book.id,
        title: book.title,
        author: book.author,
        status: 'FINISHED',
        rating: book.rating,
        isbn: book.isbn,
        imageUrl: book.imageUrl,
        notes: book.notes,
        finishedAt: book.finishedAt,
        createdAt: book.createdAt,
      }).catch(() => {
        // Non-blocking: Notion integration is optional
      });

      // Send Slack notification (fire-and-forget)
      import('../../services/slack-mcp')
        .then(({ sendNotification, isSlackConfigured }) => {
          if (!isSlackConfigured()) return;
          import('../../services/slack-templates').then(
            ({ bookCompletedMessage }) => {
              const message = bookCompletedMessage({
                title: book.title,
                author: book.author,
                rating: book.rating,
                imageUrl: book.imageUrl,
                finishedAt: book.finishedAt,
              });
              sendNotification('#general', message);
            }
          );
        })
        .catch(() => {
          /* Non-blocking: Slack integration is optional */
        });
    }
  }

  return result;
}
