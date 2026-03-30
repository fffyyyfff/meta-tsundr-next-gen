import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { orchestrator } from '../agents/orchestrator';
import type { AgentType } from '../agents/orchestrator';
import { prisma } from '../../lib/prisma';

export const agentRouter = router({
  executeTask: publicProcedure
    .input(
      z.object({
        task: z.string(),
        agentType: z.enum(['design', 'code-review', 'test-gen', 'task-mgmt']),
        userId: z.string(),
        projectId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const execution = await prisma.agentExecution.create({
        data: {
          agentType: input.agentType,
          task: input.task,
          status: 'running',
          userId: input.userId,
          projectId: input.projectId,
        },
      });

      const startTime = Date.now();

      try {
        const result = await orchestrator.executeAgent(
          input.agentType as AgentType,
          input.task,
        );

        const duration = Date.now() - startTime;

        const updated = await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'completed',
            result: typeof result === 'string' ? result : JSON.stringify(result),
            duration,
          },
        });

        return { ...result, executionId: updated.id };
      } catch (error) {
        const duration = Date.now() - startTime;

        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'error',
            result: error instanceof Error ? error.message : String(error),
            duration,
          },
        });

        throw error;
      }
    }),

  executeWorkflow: publicProcedure
    .input(
      z.object({
        task: z.string(),
        workflow: z.enum(['design-to-code', 'custom']),
        steps: z
          .array(
            z.object({
              agentType: z.enum(['design', 'code-review', 'test-gen', 'task-mgmt']),
              task: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.workflow === 'design-to-code') {
        return orchestrator.executeDesignToCodeWorkflow(input.task);
      }

      if (input.steps) {
        return orchestrator.executeWorkflow(input.steps);
      }

      throw new Error('Custom workflow requires steps');
    }),

  listAgents: publicProcedure.query(async () => {
    return [
      {
        id: '1',
        name: 'Design Agent',
        type: 'design' as const,
        description: 'Figmaデザインからコンポーネント自動生成',
      },
      {
        id: '2',
        name: 'Code Review Agent',
        type: 'code-review' as const,
        description: 'コード品質・セキュリティレビュー',
      },
      {
        id: '3',
        name: 'Test Generation Agent',
        type: 'test-gen' as const,
        description: 'Playwright E2Eテスト自動生成',
      },
      {
        id: '4',
        name: 'Task Management Agent',
        type: 'task-mgmt' as const,
        description: 'タスク分解・見積もり・Linear連携',
      },
    ];
  }),
});
