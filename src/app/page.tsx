import { AgentExecutor } from '@/components/agent-executor';
import { AgentResults } from '@/components/agent-results';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Meta-tsundr Next Gen
          </h1>
          <p className="text-xl text-muted-foreground">
            AI Agent Platform with Claude SDK & MCP Integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <AgentExecutor />
          </div>
          <div>
            <AgentResults />
          </div>
        </div>
      </main>
    </div>
  );
}
