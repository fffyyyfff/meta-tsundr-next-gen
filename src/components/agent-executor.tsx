'use client';

import { useState } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { trpcReact } from '@/lib/trpc-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AgentType = 'design' | 'code-review' | 'test-gen' | 'task-mgmt';

export function AgentExecutor() {
  const [task, setTask] = useState('');
  const [agentType, setAgentType] = useState<AgentType>('design');
  const { addAgent, updateAgent } = useAgentStore();

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
    onSuccess: (data, variables, context) => {
      if (context?.agentId) {
        const resultText = 'result' in data ? data.result : 'error' in data ? data.error : 'Unknown error';
        updateAgent(context.agentId, {
          status: data.success ? 'completed' : 'error',
          result: resultText,
        });
      }
    },
    onError: (error, variables, context) => {
      if (context?.agentId) {
        updateAgent(context.agentId, {
          status: 'error',
          result: error.message,
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    await executeTask.mutateAsync({
      task,
      agentType,
    });

    setTask('');
  };

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              disabled={executeTask.isPending}
            />
          </div>

          <Button
            type="submit"
            disabled={executeTask.isPending || !task.trim()}
            className="w-full"
          >
            {executeTask.isPending ? 'Executing...' : 'Execute Task'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
