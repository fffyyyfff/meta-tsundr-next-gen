import { NextRequest } from 'next/server';
import { orchestrator } from '@/server/agents/orchestrator';
import type { AgentType } from '@/server/agents/orchestrator';

/**
 * SSE event types sent to the client:
 *   status   – agent lifecycle (queued, started, agent_switch)
 *   progress – incremental progress update (0-100)
 *   complete – final result payload
 *   error    – error details
 */

interface SSEEvent {
  event: 'status' | 'progress' | 'complete' | 'error';
  data: Record<string, unknown>;
}

function encodeSSE(evt: SSEEvent): string {
  return `event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\n\n`;
}

const VALID_AGENT_TYPES = new Set<string>([
  'design',
  'code-review',
  'test-gen',
  'task-mgmt',
]);

const WORKFLOW_STEPS: { agentType: AgentType; label: string }[] = [
  { agentType: 'design', label: 'Design Extraction' },
  { agentType: 'code-review', label: 'Code Review' },
  { agentType: 'test-gen', label: 'Test Generation' },
  { agentType: 'task-mgmt', label: 'Task Management' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const task = searchParams.get('task');
  const agentType = searchParams.get('agentType');
  const workflow = searchParams.get('workflow');

  if (!task) {
    return new Response(JSON.stringify({ error: 'task parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (evt: SSEEvent) => {
        try {
          controller.enqueue(new TextEncoder().encode(encodeSSE(evt)));
        } catch {
          // Stream already closed
        }
      };

      try {
        if (workflow === 'design-to-code') {
          // ---- Workflow mode: stream each step ----
          send({
            event: 'status',
            data: {
              phase: 'started',
              message: 'Design-to-Code workflow started',
              totalSteps: WORKFLOW_STEPS.length,
            },
          });

          const results: { agentType: string; success: boolean; result?: string }[] = [];

          for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
            const step = WORKFLOW_STEPS[i];

            send({
              event: 'status',
              data: {
                phase: 'agent_switch',
                step: i + 1,
                totalSteps: WORKFLOW_STEPS.length,
                agentType: step.agentType,
                label: step.label,
              },
            });

            send({
              event: 'progress',
              data: {
                percent: Math.round((i / WORKFLOW_STEPS.length) * 100),
                step: i + 1,
                totalSteps: WORKFLOW_STEPS.length,
                message: `Running ${step.label}...`,
              },
            });

            // Build enriched task with previous results
            let enrichedTask = task;
            if (results.length > 0) {
              const prev = results
                .filter((r) => r.success)
                .map((r) => `[${r.agentType}]: ${r.result?.slice(0, 500)}`)
                .join('\n\n');
              enrichedTask = `${task}\n\n--- Previous results ---\n${prev}`;
            }

            const result = await orchestrator.executeAgent(step.agentType, enrichedTask);
            results.push({
              agentType: step.agentType,
              success: result.success,
              result: result.result ?? result.error,
            });

            if (!result.success) {
              send({
                event: 'error',
                data: {
                  step: i + 1,
                  agentType: step.agentType,
                  message: result.error ?? 'Agent execution failed',
                },
              });
              break;
            }

            send({
              event: 'progress',
              data: {
                percent: Math.round(((i + 1) / WORKFLOW_STEPS.length) * 100),
                step: i + 1,
                totalSteps: WORKFLOW_STEPS.length,
                message: `${step.label} completed`,
                duration: result.duration,
              },
            });
          }

          send({
            event: 'complete',
            data: {
              results,
              totalSteps: WORKFLOW_STEPS.length,
              completedSteps: results.length,
            },
          });
        } else {
          // ---- Single agent mode ----
          if (!agentType || !VALID_AGENT_TYPES.has(agentType)) {
            send({
              event: 'error',
              data: { message: `Invalid agentType: ${agentType ?? 'missing'}` },
            });
            controller.close();
            return;
          }

          send({
            event: 'status',
            data: {
              phase: 'queued',
              agentType,
              message: `${agentType} agent queued`,
            },
          });

          send({
            event: 'status',
            data: {
              phase: 'started',
              agentType,
              message: `${agentType} agent started`,
            },
          });

          send({
            event: 'progress',
            data: { percent: 10, message: 'Initializing agent...' },
          });

          const result = await orchestrator.executeAgent(
            agentType as AgentType,
            task,
          );

          if (result.success) {
            send({
              event: 'progress',
              data: { percent: 100, message: 'Execution complete' },
            });

            send({
              event: 'complete',
              data: {
                success: true,
                result: result.result,
                duration: result.duration,
                tokenUsage: result.tokenUsage,
                artifacts: result.artifacts,
              },
            });
          } else {
            send({
              event: 'error',
              data: {
                message: result.error ?? 'Agent execution failed',
                duration: result.duration,
              },
            });
          }
        }
      } catch (err) {
        send({
          event: 'error',
          data: {
            message: err instanceof Error ? err.message : 'Internal server error',
          },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
