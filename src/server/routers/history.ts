import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

export const historyRouter = router({
  listExecutions: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        projectId: z.string().optional(),
        agentType: z.enum(['design', 'code-review', 'test-gen', 'task-mgmt']).optional(),
        status: z.enum(['pending', 'running', 'completed', 'error']).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { userId, projectId, agentType, status, limit, cursor } = input;

      const executions = await prisma.agentExecution.findMany({
        where: {
          userId,
          ...(projectId && { projectId }),
          ...(agentType && { agentType }),
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      const hasMore = executions.length > limit;
      const items = hasMore ? executions.slice(0, limit) : executions;
      const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

      return { items, nextCursor };
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
