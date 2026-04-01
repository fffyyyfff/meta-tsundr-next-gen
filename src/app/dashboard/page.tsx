import { AgentExecutor } from '@/components/agent-executor';
import { AgentResults } from '@/components/agent-results';
import { Dashboard } from '@/components/dashboard';
import { WorkflowRunner } from '@/components/workflow-runner';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8 space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            AI ダッシュボード
          </h1>
          <p className="text-xl text-muted-foreground">
            AI Agent Platform with Claude SDK & MCP Integration
          </p>
        </div>

        {/* Agent Executor + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <AgentExecutor />
          </div>
          <div>
            <AgentResults />
          </div>
        </div>

        {/* Workflow Runner */}
        <section>
          <WorkflowRunner />
        </section>

        {/* Execution History Dashboard */}
        <section>
          <Dashboard />
        </section>
      </main>
    </div>
  );
}
