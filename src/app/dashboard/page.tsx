import dynamic from 'next/dynamic';
import { PageHeader } from '@/shared/components/page-header';

const AgentExecutor = dynamic(
  () => import('@/features/dashboard/components/agent-executor').then(m => m.AgentExecutor),
  { ssr: false },
);
const AgentResults = dynamic(
  () => import('@/features/dashboard/components/agent-results').then(m => m.AgentResults),
  { ssr: false },
);
const Dashboard = dynamic(
  () => import('@/features/dashboard/components/dashboard').then(m => m.Dashboard),
  { ssr: false },
);
const WorkflowRunner = dynamic(
  () => import('@/features/dashboard/components/workflow-runner').then(m => m.WorkflowRunner),
  { ssr: false },
);

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
