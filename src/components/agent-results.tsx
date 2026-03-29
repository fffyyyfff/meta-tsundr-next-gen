'use client';

import { useAgentStore } from '@/stores/agentStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AgentResults() {
  const { agents, activeAgent, setActiveAgent, clearAgents } = useAgentStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '⏳';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  return (
    <div className="space-y-4">
      {agents.length > 0 && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Agent Results ({agents.length})</h3>
          <Button variant="outline" size="sm" onClick={clearAgents}>
            Clear All
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer transition-all ${
              activeAgent?.id === agent.id
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => setActiveAgent(agent)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{getStatusIcon(agent.status)}</span>
                  <span>{agent.name}</span>
                </CardTitle>
                <span
                  className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(
                    agent.status
                  )}`}
                >
                  {agent.status}
                </span>
              </div>
            </CardHeader>
            {agent.result && (
              <CardContent className="pt-0">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm">
                  <pre className="whitespace-pre-wrap break-words">
                    {agent.result}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No agent results yet. Execute a task to see results here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
