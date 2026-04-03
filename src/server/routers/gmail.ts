import { router, publicProcedure } from '../trpc';
import { prisma } from '../../lib/prisma';

export const gmailRouter = router({
  getStatus: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId ?? 'dev-user';

    try {
      const connection = await prisma.gmailConnection.findUnique({
        where: { userId },
        select: { email: true, lastSyncAt: true },
      });

      if (!connection) {
        return { connected: false, email: null, lastSyncAt: null };
      }

      return {
        connected: true,
        email: connection.email,
        lastSyncAt: connection.lastSyncAt,
      };
    } catch {
      return { connected: false, email: null, lastSyncAt: null };
    }
  }),

  disconnect: publicProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId ?? 'dev-user';

    try {
      await prisma.gmailConnection.delete({
        where: { userId },
      });
    } catch {
      // Connection may not exist
    }

    return { success: true };
  }),

  sync: publicProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId ?? 'dev-user';

    const connection = await prisma.gmailConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return { newItems: 0, skipped: 0, errors: ['Gmail未連携です。先にGmailを連携してください。'] };
    }

    try {
      const { syncPurchases } = await import('../services/gmail-orchestrator');
      const result = await syncPurchases(userId);

      return {
        newItems: result.newItems,
        skipped: result.skipped,
        errors: result.errors > 0
          ? [`${result.errors}件のメールでエラーが発生しました`]
          : ([] as string[]),
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : '同期中にエラーが発生しました';
      return { newItems: 0, skipped: 0, errors: [message] };
    }
  }),
});
