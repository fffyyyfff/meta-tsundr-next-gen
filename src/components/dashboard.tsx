'use client';

import { useEffect, useCallback } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { trpcReact } from '@/lib/trpc-provider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const {
    executions,
    executionsLoading,
    executionsCursor,
    setExecutions,
    appendExecutions,
    setExecutionsLoading,
    setExecutionsCursor,
  } = useAgentStore();

  const listQuery = trpcReact.history.listExecutions.useQuery(
    { userId, limit: 20 },
    { enabled: executions.length === 0 },
  );

  const loadMoreQuery = trpcReact.history.listExecutions.useQuery(
    { userId, limit: 20, cursor: executionsCursor },
    { enabled: false },
  );

  useEffect(() => {
    if (listQuery.data) {
      setExecutions(
        listQuery.data.items.map((item) => ({
          id: item.id,
          agentType: item.agentType,
          task: item.task,
          result: item.result,
          status: item.status,
          duration: item.duration,
          createdAt: item.createdAt.toString(),
          project: item.project,
        })),
      );
      setExecutionsCursor(listQuery.data.nextCursor ?? undefined);
    }
  }, [listQuery.data, setExecutions, setExecutionsCursor]);

  const handleLoadMore = useCallback(async () => {
    if (!executionsCursor) return;
    setExecutionsLoading(true);
    const result = await loadMoreQuery.refetch();
    if (result.data) {
      appendExecutions(
        result.data.items.map((item) => ({
          id: item.id,
          agentType: item.agentType,
          task: item.task,
          result: item.result,
          status: item.status,
          duration: item.duration,
          createdAt: item.createdAt.toString(),
          project: item.project,
        })),
      );
      setExecutionsCursor(result.data.nextCursor ?? undefined);
    }
    setExecutionsLoading(false);
  }, [executionsCursor, loadMoreQuery, appendExecutions, setExecutionsCursor, setExecutionsLoading]);

  const handleRefresh = useCallback(() => {
    setExecutions([]);
    setExecutionsCursor(undefined);
    listQuery.refetch();
  }, [listQuery, setExecutions, setExecutionsCursor]);

  const stats = {
    total: executions.length,
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
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={listQuery.isLoading}>
          Refresh
        </Button>
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

      {/* Execution list */}
      <div className="space-y-3">
        {listQuery.isLoading && executions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading execution history...
            </CardContent>
          </Card>
        ) : executions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No executions yet. Run an agent to see history here.
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

      {/* Load more */}
      {executionsCursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={executionsLoading}>
            {executionsLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
