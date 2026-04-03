import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';

export const notificationRouter = router({
  listNotifications: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      try {
        const notifications = await prisma.notification.findMany({
          where: {
            userId: input.userId,
            ...(input.unreadOnly && { read: false }),
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
        });

        const unreadCount = await prisma.notification.count({
          where: { userId: input.userId, read: false },
        });

      return {
        notifications: notifications.map((n) => ({
          id: n.id,
          event: n.event,
          title: n.title,
          message: n.message,
          read: n.read,
          metadata: n.metadata ? JSON.parse(n.metadata) : null,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
      };
      } catch {
        // DB not available
        return { notifications: [], unreadCount: 0 };
      }
    }),

  markAsRead: publicProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string()).min(1),
      }),
    )
    .mutation(async ({ input }) => {
      await prisma.notification.updateMany({
        where: { id: { in: input.notificationIds } },
        data: { read: true },
      });
      return { success: true };
    }),

  configureWebhook: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        slackUrl: z.string().url().nullable(),
        events: z.array(
          z.enum(['agent.completed', 'agent.failed', 'workflow.completed']),
        ),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const data = {
        slackUrl: input.slackUrl,
        events: input.events.join(','),
        enabled: input.enabled,
      };

      const config = await prisma.webhookConfig.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId, ...data },
        update: data,
      });

      return {
        id: config.id,
        slackUrl: config.slackUrl,
        events: config.events.split(','),
        enabled: config.enabled,
      };
    }),
});
