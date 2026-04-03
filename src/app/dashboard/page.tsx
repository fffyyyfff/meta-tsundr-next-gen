import { AgentExecutor } from '@/features/dashboard/components/agent-executor';
import { AgentResults } from '@/features/dashboard/components/agent-results';
import { Dashboard } from '@/features/dashboard/components/dashboard';
import { WorkflowRunner } from '@/features/dashboard/components/workflow-runner';
import { PageHeader } from '@/shared/components/page-header';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8 space-y-10">
        <PageHeader
          title="AI ダッシュボード"
          description="AI Agent Platform with Claude SDK & MCP Integration"
        />

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
