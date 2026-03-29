import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { orchestrator } from '../agents/orchestrator';
import type { AgentType } from '../agents/orchestrator';

export const agentRouter = router({
  executeTask: publicProcedure
    .input(
      z.object({
        task: z.string(),
        agentType: z.enum(['design', 'code-review', 'test-gen', 'task-mgmt']),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await orchestrator.executeAgent(
        input.agentType as AgentType,
        input.task,
      );
      return result;
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
