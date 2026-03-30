'use client';

import { useState, useCallback } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { useAgentStream } from '@/hooks/useAgentStream';
import { trpcReact } from '@/lib/trpc-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AgentType = 'design' | 'code-review' | 'test-gen' | 'task-mgmt';

const CONNECTION_LABEL: Record<string, string> = {
  idle: '',
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  closed: '',
  error: 'Connection error',
};

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className ?? ''}`}>
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function AgentExecutor() {
  const [task, setTask] = useState('');
  const [agentType, setAgentType] = useState<AgentType>('design');
  const [useStream, setUseStream] = useState(true);
  const { addAgent, updateAgent } = useAgentStore();

  const {
    connect,
    disconnect,
    connectionState,
    progress,
    statusMessage,
    error: streamError,
    isComplete,
  } = useAgentStream({
    onEvent: (event) => {
      if (event.type === 'complete') {
        const data = event.data;
        const resultText = data.result ?? (data.results
          ? data.results.map((r) => `[${r.agentType}] ${r.result ?? ''}`).join('\n')
          : 'Done');
        updateAgent(activeAgentIdRef, {
          status: 'completed',
          result: resultText,
        });
      } else if (event.type === 'error') {
        updateAgent(activeAgentIdRef, {
          status: 'error',
          result: event.data.message,
        });
      }
    },
  });

  // Track the current agent ID for stream callbacks
  let activeAgentIdRef = '';

  // Fallback: tRPC mutation (non-streaming)
  const executeTask = trpcReact.agent.executeTask.useMutation({
    onMutate: () => {
      const agentId = `agent-${Date.now()}`;
      addAgent({
        id: agentId,
        name: `${agentType} Agent`,
        type: agentType,
        status: 'running',
      });
      return { agentId };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.agentId) {
        const resultText = 'result' in data ? data.result : 'error' in data ? data.error : 'Unknown error';
        updateAgent(context.agentId, {
          status: data.success ? 'completed' : 'error',
          result: resultText,
        });
      }
    },
    onError: (error, _variables, context) => {
      if (context?.agentId) {
        updateAgent(context.agentId, {
          status: 'error',
          result: error.message,
        });
      }
    },
  });

  const isRunning =
    executeTask.isPending ||
    (connectionState === 'connecting' || connectionState === 'connected' || connectionState === 'reconnecting');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!task.trim() || isRunning) return;

      const agentId = `agent-${Date.now()}`;
      activeAgentIdRef = agentId;

      addAgent({
        id: agentId,
        name: `${agentType} Agent`,
        type: agentType,
        status: 'running',
      });

      if (useStream) {
        connect({ task, agentType });
      } else {
        await executeTask.mutateAsync({
          task,
          agentType,
          userId: 'dev-user',
        });
      }

      setTask('');
    },
    [task, agentType, isRunning, useStream, addAgent, connect, executeTask],
  );

  const handleCancel = useCallback(() => {
    disconnect();
    if (activeAgentIdRef) {
      updateAgent(activeAgentIdRef, {
        status: 'error',
        result: 'Cancelled by user',
      });
    }
  }, [disconnect, updateAgent]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Execute AI Agent Task</CardTitle>
        <CardDescription>
          Select an agent type and describe your task
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-type">Agent Type</Label>
            <select
              id="agent-type"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value as AgentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              disabled={isRunning}
            >
              <option value="design">Design Agent (Figma → Code)</option>
              <option value="code-review">Code Review Agent</option>
              <option value="test-gen">Test Generation Agent</option>
              <option value="task-mgmt">Task Management Agent</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">Task Description</Label>
            <Input
              id="task"
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe your task..."
              disabled={isRunning}
            />
          </div>

          {/* Streaming toggle */}
          <div className="flex items-center gap-2">
            <input
              id="use-stream"
              type="checkbox"
              checked={useStream}
              onChange={(e) => setUseStream(e.target.checked)}
              disabled={isRunning}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="use-stream" className="text-sm font-normal cursor-pointer">
              Real-time streaming (SSE)
            </Label>
          </div>

          {/* Progress section */}
          {isRunning && useStream && (
            <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-800 dark:text-blue-300">
                  {statusMessage || CONNECTION_LABEL[connectionState] || 'Processing...'}
                </span>
                <span className="text-blue-600 dark:text-blue-400">{progress}%</span>
              </div>
              <ProgressBar percent={progress} />
              {connectionState === 'reconnecting' && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Connection interrupted. Attempting to reconnect...
                </p>
              )}
            </div>
          )}

          {/* Stream error */}
          {streamError && !isRunning && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm text-red-800 dark:text-red-300">{streamError}</p>
            </div>
          )}

          {/* Completion indicator */}
          {isComplete && !isRunning && !streamError && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                Agent execution completed successfully.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isRunning || !task.trim()}
              className="flex-1"
            >
              {isRunning ? 'Executing...' : 'Execute Task'}
            </Button>
            {isRunning && useStream && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
