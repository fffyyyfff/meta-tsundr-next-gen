import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';

const executionFilterInput = z.object({
  userId: z.string(),
  agentType: z.enum(['design', 'code-review', 'test-gen', 'task-mgmt']).optional(),
  status: z.enum(['pending', 'running', 'completed', 'error']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

function buildWhere(input: z.infer<typeof executionFilterInput>) {
  return {
    userId: input.userId,
    ...(input.agentType && { agentType: input.agentType }),
    ...(input.status && { status: input.status }),
    ...((input.from ?? input.to) && {
      createdAt: {
        ...(input.from && { gte: new Date(input.from) }),
        ...(input.to && { lte: new Date(input.to) }),
      },
    }),
  };
}

export const exportRouter = router({
  exportAsJson: publicProcedure
    .input(executionFilterInput)
    .query(async ({ input }) => {
      const executions = await prisma.agentExecution.findMany({
        where: buildWhere(input),
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true } } },
      });

      return {
        exportedAt: new Date().toISOString(),
        count: executions.length,
        executions: executions.map((e) => ({
          id: e.id,
          agentType: e.agentType,
          task: e.task,
          result: e.result,
          status: e.status,
          duration: e.duration,
          tokenUsage: e.tokenUsage,
          project: e.project?.name ?? null,
          createdAt: e.createdAt.toISOString(),
        })),
      };
    }),

  exportAsMarkdown: publicProcedure
    .input(executionFilterInput)
    .query(async ({ input }) => {
      const executions = await prisma.agentExecution.findMany({
        where: buildWhere(input),
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true } } },
      });

      const lines: string[] = [
        '# Agent Execution Report',
        '',
        `**Exported:** ${new Date().toISOString()}`,
        `**Total executions:** ${executions.length}`,
        '',
        '---',
        '',
      ];

      for (const e of executions) {
        const duration = e.duration !== null ? `${e.duration}ms` : '-';
        lines.push(`## ${e.agentType} — ${e.status}`);
        lines.push('');
        lines.push(`| Field | Value |`);
        lines.push(`|-------|-------|`);
        lines.push(`| ID | \`${e.id}\` |`);
        lines.push(`| Task | ${e.task} |`);
        lines.push(`| Status | **${e.status}** |`);
        lines.push(`| Duration | ${duration} |`);
        lines.push(`| Tokens | ${e.tokenUsage ?? '-'} |`);
        lines.push(`| Project | ${e.project?.name ?? '-'} |`);
        lines.push(`| Date | ${e.createdAt.toISOString()} |`);
        lines.push('');
        if (e.result) {
          lines.push('<details><summary>Result</summary>');
          lines.push('');
          lines.push('```');
          lines.push(e.result);
          lines.push('```');
          lines.push('');
          lines.push('</details>');
          lines.push('');
        }
        lines.push('---');
        lines.push('');
      }

      return { markdown: lines.join('\n') };
    }),

  exportAsCsv: publicProcedure
    .input(executionFilterInput)
    .query(async ({ input }) => {
      const executions = await prisma.agentExecution.findMany({
        where: buildWhere(input),
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true } } },
      });

      const header = 'id,agentType,task,status,duration,tokenUsage,project,createdAt';
      const rows = executions.map((e) =>
        [
          e.id,
          e.agentType,
          csvEscape(e.task),
          e.status,
          e.duration ?? '',
          e.tokenUsage ?? '',
          csvEscape(e.project?.name ?? ''),
          e.createdAt.toISOString(),
        ].join(','),
      );

      return { csv: [header, ...rows].join('\n') };
    }),
});

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
