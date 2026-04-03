'use client';

import { useAgentStore } from '@/features/dashboard/stores/agentStore';
import { useFavoritesStore } from '@/features/dashboard/stores/favoritesStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

interface AgentResultsProps {
  onCompare?: (execution: {
    id: string;
    agentType: string;
    task: string;
    result: string | null;
    status: string;
    duration: number | null;
    tokenUsage?: number | null;
    createdAt: string;
  }) => void;
}

export function AgentResults({ onCompare }: AgentResultsProps) {
  const { agents, activeAgent, setActiveAgent, clearAgents } = useAgentStore();
  const { add, remove, isFavorite } = useFavoritesStore();

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

  const handleToggleFavorite = (agent: (typeof agents)[number]) => {
    const favorited = isFavorite(agent.id);
    if (favorited) {
      remove(agent.id);
    } else {
      add({
        id: agent.id,
        agentType: agent.type,
        task: agent.name,
        result: agent.result ?? null,
        status: agent.status,
        duration: null,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleCompare = (agent: (typeof agents)[number]) => {
    onCompare?.({
      id: agent.id,
      agentType: agent.type,
      task: agent.name,
      result: agent.result ?? null,
      status: agent.status,
      duration: null,
      createdAt: new Date().toISOString(),
    });
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
        {agents.map((agent) => {
          const favorited = isFavorite(agent.id);
          return (
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(agent);
                      }}
                      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {favorited ? '★' : '☆'}
                    </Button>
                    {onCompare && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompare(agent);
                        }}
                        aria-label="Add to comparison"
                        title="Add to comparison"
                      >
                        ⇔
                      </Button>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(
                        agent.status
                      )}`}
                    >
                      {agent.status}
                    </span>
                  </div>
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
          );
        })}
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
