import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';

export const historyRouter = router({
  listExecutions: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        projectId: z.string().optional(),
        agentType: z.enum(['design', 'code-review', 'test-gen', 'task-mgmt']).optional(),
        status: z.enum(['pending', 'running', 'completed', 'error']).optional(),
        limit: z.number().min(1).max(100).default(10),
        page: z.number().min(1).default(1),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { userId, projectId, agentType, status, limit, page, cursor } = input;

      const where = {
        userId,
        ...(projectId && { projectId }),
        ...(agentType && { agentType }),
        ...(status && { status }),
      };

      const [totalCount, executions] = await Promise.all([
        prisma.agentExecution.count({ where }),
        prisma.agentExecution.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          ...(cursor
            ? { take: limit + 1, cursor: { id: cursor }, skip: 1 }
            : { take: limit, skip: (page - 1) * limit }),
          include: {
            project: { select: { id: true, name: true } },
          },
        }),
      ]);

      if (cursor) {
        const hasMore = executions.length > limit;
        const items = hasMore ? executions.slice(0, limit) : executions;
        const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;
        return { items, nextCursor, totalCount };
      }

      return { items: executions, nextCursor: undefined, totalCount };
    }),

  getExecution: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const execution = await prisma.agentExecution.findUnique({
        where: { id: input.id },
        include: {
          project: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (!execution) {
        throw new Error('Execution not found');
      }

      return execution;
    }),
});
