'use client';

import { useState, useCallback } from 'react';
import { trpcReact } from '@/shared/lib/trpc-provider';
import { usePagination } from '@/shared/hooks/usePagination';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ExportButton } from '@/features/dashboard/components/export-button';

const STATUS_CONFIG = {
  completed: {
    label: 'Success',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  error: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  running: {
    label: 'Running',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse',
  },
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
} as const;

const AGENT_LABELS: Record<string, string> = {
  design: 'Design Agent',
  'code-review': 'Code Review',
  'test-gen': 'Test Gen',
  'task-mgmt': 'Task Mgmt',
};

type AgentTypeFilter = 'all' | 'design' | 'code-review' | 'test-gen' | 'task-mgmt';
type StatusFilter = 'all' | 'completed' | 'error' | 'running';

const AGENT_TYPE_OPTIONS: { value: AgentTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Agents' },
  { value: 'design', label: 'Design' },
  { value: 'code-review', label: 'CodeReview' },
  { value: 'test-gen', label: 'TestGen' },
  { value: 'task-mgmt', label: 'TaskMgmt' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Success' },
  { value: 'error', label: 'Failed' },
  { value: 'running', label: 'Running' },
];

const ITEMS_PER_PAGE = 10;

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = Math.round(seconds % 60);
  return `${minutes}m ${remainingSec}s`;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface DashboardProps {
  userId?: string;
}

export function Dashboard({ userId = 'default-user' }: DashboardProps) {
  const [agentTypeFilter, setAgentTypeFilter] = useState<AgentTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const queryInput = {
    userId,
    limit: ITEMS_PER_PAGE,
    page,
    ...(agentTypeFilter !== 'all' && { agentType: agentTypeFilter as 'design' | 'code-review' | 'test-gen' | 'task-mgmt' }),
    ...(statusFilter !== 'all' && { status: statusFilter as 'completed' | 'error' | 'running' }),
  };

  const listQuery = trpcReact.history.listExecutions.useQuery(queryInput);

  const totalCount = listQuery.data?.totalCount ?? 0;
  const executions = (listQuery.data?.items ?? []).map((item) => ({
    id: item.id,
    agentType: item.agentType,
    task: item.task,
    result: item.result,
    status: item.status,
    duration: item.duration,
    createdAt: item.createdAt.toString(),
    project: item.project,
  }));

  const { currentPage, totalPages, hasNext, hasPrev } = usePagination({
    totalItems: totalCount,
    itemsPerPage: ITEMS_PER_PAGE,
    initialPage: page,
  });

  const handleAgentTypeChange = useCallback(
    (value: AgentTypeFilter) => {
      setAgentTypeFilter(value);
      setPage(1);
    },
    [],
  );

  const handleStatusChange = useCallback(
    (value: StatusFilter) => {
      setStatusFilter(value);
      setPage(1);
    },
    [],
  );

  const handlePrev = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNext = useCallback(() => {
    setPage((p) => Math.min(p + 1, Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))));
  }, [totalCount]);

  const stats = {
    total: totalCount,
    success: executions.filter((e) => e.status === 'completed').length,
    failed: executions.filter((e) => e.status === 'error').length,
    running: executions.filter((e) => e.status === 'running').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Execution History</h2>
          <p className="text-muted-foreground">Agent execution logs and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            userId={userId}
            agentType={agentTypeFilter !== 'all' ? agentTypeFilter : undefined}
            status={statusFilter !== 'all' ? statusFilter : undefined}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Success', value: stats.success, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Failed', value: stats.failed, color: 'text-red-600 dark:text-red-400' },
          { label: 'Running', value: stats.running, color: 'text-blue-600 dark:text-blue-400' },
        ].map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="agent-type-filter" className="text-sm font-medium text-muted-foreground">
            Agent:
          </label>
          <select
            id="agent-type-filter"
            value={agentTypeFilter}
            onChange={(e) => handleAgentTypeChange(e.target.value as AgentTypeFilter)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {AGENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as StatusFilter)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {totalCount} results
        </span>
      </div>

      {/* Execution list */}
      <div className="space-y-3">
        {listQuery.isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading execution history...
            </CardContent>
          </Card>
        ) : executions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No executions found.
            </CardContent>
          </Card>
        ) : (
          executions.map((execution) => (
            <Card key={execution.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-sm">
                      {AGENT_LABELS[execution.agentType] ?? execution.agentType}
                    </CardTitle>
                    <StatusBadge status={execution.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span title="Duration">{formatDuration(execution.duration)}</span>
                    <span>{formatTimestamp(execution.createdAt)}</span>
                  </div>
                </div>
                <CardDescription className="line-clamp-1 mt-1">{execution.task}</CardDescription>
              </CardHeader>
              {execution.result && (
                <CardContent className="pt-0">
                  <div className="rounded-md bg-muted/50 p-3">
                    <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                      {execution.result.length > 300
                        ? `${execution.result.slice(0, 300)}...`
                        : execution.result}
                    </pre>
                  </div>
                </CardContent>
              )}
              {execution.project && (
                <CardFooter>
                  <span className="text-xs text-muted-foreground">
                    Project: {execution.project.name}
                  </span>
                </CardFooter>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={!hasPrev || listQuery.isLoading}
          >
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!hasNext || listQuery.isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
