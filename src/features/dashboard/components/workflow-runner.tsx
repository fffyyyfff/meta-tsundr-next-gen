'use client';

import { useState, useCallback } from 'react';
import { trpcReact } from '@/shared/lib/trpc-provider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface WorkflowStep {
  id: number;
  agentType: 'design' | 'code-review' | 'test-gen' | 'task-mgmt';
  label: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
  duration?: number;
}

const DESIGN_TO_CODE_STEPS: Omit<WorkflowStep, 'status'>[] = [
  {
    id: 1,
    agentType: 'design',
    label: 'Design Extraction',
    description: 'Figma design tokens and component structure extraction',
  },
  {
    id: 2,
    agentType: 'design',
    label: 'Component Generation',
    description: 'React component code generation from design',
  },
  {
    id: 3,
    agentType: 'code-review',
    label: 'Code Review',
    description: 'Quality, security, and best practices review',
  },
  {
    id: 4,
    agentType: 'test-gen',
    label: 'Test Generation',
    description: 'Playwright E2E test creation',
  },
];

const STEP_STATUS_STYLES = {
  pending: 'border-muted bg-muted/20',
  running: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  completed: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
  error: 'border-red-500 bg-red-50 dark:bg-red-950/20',
} as const;

const STEP_INDICATOR = {
  pending: 'bg-muted text-muted-foreground',
  running: 'bg-blue-500 text-white animate-pulse',
  completed: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
} as const;

function formatStepDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function WorkflowRunner() {
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<string | null>(null);

  const executeWorkflow = trpcReact.agent.executeWorkflow.useMutation();

  const handleRun = useCallback(async () => {
    if (!task.trim() || isRunning) return;

    setIsRunning(true);
    setWorkflowResult(null);
    setSteps(DESIGN_TO_CODE_STEPS.map((s) => ({ ...s, status: 'pending' as const })));

    // Simulate step-by-step progress while the actual workflow runs
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    DESIGN_TO_CODE_STEPS.forEach((_, idx) => {
      stepTimers.push(
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s, i) => {
              if (i === idx) return { ...s, status: 'running' as const };
              if (i === idx - 1 && prev[i]?.status === 'running') {
                return { ...s, status: 'completed' as const, duration: 1500 + Math.random() * 3000 };
              }
              return s;
            }),
          );
        }, idx * 3000),
      );
    });

    try {
      const result = await executeWorkflow.mutateAsync({
        task,
        workflow: 'design-to-code',
      });

      stepTimers.forEach(clearTimeout);

      setSteps((prev) =>
        prev.map((s) => ({
          ...s,
          status: 'completed' as const,
          duration: s.duration ?? 2000 + Math.random() * 2000,
        })),
      );

      setWorkflowResult(
        Array.isArray(result)
          ? result.map((r) => (typeof r === 'string' ? r : JSON.stringify(r))).join('\n---\n')
          : typeof result === 'string'
            ? result
            : JSON.stringify(result, null, 2),
      );
    } catch (error) {
      stepTimers.forEach(clearTimeout);

      setSteps((prev) => {
        const runningIdx = prev.findIndex((s) => s.status === 'running');
        return prev.map((s, i) => {
          if (i === runningIdx || (runningIdx === -1 && i === 0)) {
            return {
              ...s,
              status: 'error' as const,
              result: error instanceof Error ? error.message : String(error),
            };
          }
          if (s.status === 'running') return { ...s, status: 'completed' as const };
          return s;
        });
      });

      setWorkflowResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsRunning(false);
    }
  }, [task, isRunning, executeWorkflow]);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Design-to-Code Workflow</CardTitle>
          <CardDescription>
            Run the full pipeline: Figma extraction, component generation, code review, and test creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-task">Task Description</Label>
              <Input
                id="workflow-task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. Convert the login page design from Figma..."
                disabled={isRunning}
              />
            </div>
            <Button
              onClick={handleRun}
              disabled={isRunning || !task.trim()}
              className="w-full"
              size="lg"
            >
              {isRunning ? 'Running Workflow...' : 'Run Design-to-Code'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{completedCount}/{steps.length} steps</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Step cards */}
      {steps.length > 0 && (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-start gap-4 rounded-lg border p-4 transition-all ${STEP_STATUS_STYLES[step.status]}`}
            >
              {/* Step number indicator */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${STEP_INDICATOR[step.status]}`}
              >
                {step.status === 'completed' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === 'error' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>

              {/* Step content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{step.label}</h4>
                  {step.duration && (
                    <span className="text-xs text-muted-foreground">
                      {formatStepDuration(step.duration)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {step.result && (
                  <div className="mt-2 rounded bg-muted/50 p-2">
                    <pre className="whitespace-pre-wrap break-words text-xs">{step.result}</pre>
                  </div>
                )}
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="absolute left-[2.25rem] mt-10 h-4 w-px bg-border" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Final result */}
      {workflowResult && !isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Workflow Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted/50 p-3">
              <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                {workflowResult}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
