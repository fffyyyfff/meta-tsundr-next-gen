import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { LinearMCPService } from '../services/linear-mcp';

const linearService = new LinearMCPService();

export const linearRouter = router({
  listIssues: publicProcedure
    .input(
      z.object({
        teamId: z.string().optional(),
        projectId: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      return linearService.listIssues(input ?? undefined);
    }),

  getIssue: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return linearService.getIssue(input.id);
    }),

  createIssue: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        teamId: z.string(),
        projectId: z.string().optional(),
        priority: z.number().min(0).max(4).optional(),
        labelIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return linearService.createIssue(input);
    }),

  updateIssue: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        stateId: z.string().optional(),
        priority: z.number().min(0).max(4).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...params } = input;
      return linearService.updateIssue(id, params);
    }),

  syncIssues: publicProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ input }) => {
      return linearService.syncIssues(input.teamId);
    }),
});
