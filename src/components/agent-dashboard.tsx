'use client';

import { useAgentStore } from '@/stores/agentStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AgentDashboard() {
  const { agents, activeAgent, setActiveAgent, clearAgents } = useAgentStore();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>AI Agent Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.length === 0 ? (
            <p className="text-muted-foreground">No agents running</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className={activeAgent?.id === agent.id ? 'border-primary' : ''}
                  onClick={() => setActiveAgent(agent)}
                >
                  <CardHeader>
                    <CardTitle className="text-sm">{agent.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-1">
                      <p>Type: {agent.type}</p>
                      <p>Status: {agent.status}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {agents.length > 0 && (
            <Button variant="outline" onClick={clearAgents}>
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
