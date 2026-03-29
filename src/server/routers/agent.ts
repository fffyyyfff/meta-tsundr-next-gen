import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { FigmaMCPService } from '../services/figma-mcp';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-test',
});

const figmaMCP = new FigmaMCPService();

export const agentRouter = router({
  executeTask: publicProcedure
    .input(
      z.object({
        task: z.string(),
        agentType: z.enum(['design', 'code-review', 'test-gen', 'task-mgmt']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Design agentでFigma URLが含まれているかチェック
        if (input.agentType === 'design') {
          const figmaUrlMatch = input.task.match(/https:\/\/(?:www\.)?figma\.com\/\S+/);

          if (figmaUrlMatch) {
            const figmaUrl = figmaUrlMatch[0];

            try {
              const design = await figmaMCP.fetchDesign(figmaUrl);
              const codeSnippets = await Promise.all(
                design.components.slice(0, 2).map((c) => figmaMCP.generateReactCode(c))
              );

              return {
                success: true,
                result: `Figmaデザイン「${design.name}」から以下のコンポーネントを生成しました:\n\n${codeSnippets.join('\n\n---\n\n')}`,
                agentType: input.agentType,
              };
            } catch (error) {
              // Figma MCPエラーの場合は通常のClaude Agentにフォールバック
              console.error('Figma MCP error, falling back to Claude Agent:', error);
            }
          }
        }

        // 通常のClaude Agent処理
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4.5',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `あなたは${input.agentType}エージェントです。以下のタスクを実行してください:\n\n${input.task}`,
            },
          ],
        });

        const content = message.content[0];
        const result = content.type === 'text' ? content.text : '';

        return {
          success: true,
          result,
          agentType: input.agentType,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          agentType: input.agentType,
        };
      }
    }),

  listAgents: publicProcedure.query(async () => {
    return [
      { id: '1', name: 'Design Agent', type: 'design' as const },
      { id: '2', name: 'Code Review Agent', type: 'code-review' as const },
      { id: '3', name: 'Test Generation Agent', type: 'test-gen' as const },
      { id: '4', name: 'Task Management Agent', type: 'task-mgmt' as const },
    ];
  }),
});
