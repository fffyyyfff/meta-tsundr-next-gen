'use client';

import { useMemo } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const AGENT_LABELS: Record<string, string> = {
  design: 'Design',
  'code-review': 'Code Review',
  'test-gen': 'Test Gen',
  'task-mgmt': 'Task Mgmt',
};

const BAR_COLORS = {
  total: 'bg-blue-500 dark:bg-blue-400',
  success: 'bg-emerald-500 dark:bg-emerald-400',
  failed: 'bg-red-500 dark:bg-red-400',
};

interface AgentStats {
  agentType: string;
  label: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
  avgDuration: number;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function StatsChart() {
  const { executions } = useAgentStore();

  const agentStats = useMemo<AgentStats[]>(() => {
    const grouped = new Map<string, typeof executions>();
    for (const exec of executions) {
      const existing = grouped.get(exec.agentType) ?? [];
      existing.push(exec);
      grouped.set(exec.agentType, existing);
    }

    return Array.from(grouped.entries()).map(([agentType, items]) => {
      const success = items.filter((e) => e.status === 'completed').length;
      const failed = items.filter((e) => e.status === 'error').length;
      const durations = items
        .filter((e) => e.duration !== null)
        .map((e) => e.duration as number);
      const avgDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;

      return {
        agentType,
        label: AGENT_LABELS[agentType] ?? agentType,
        total: items.length,
        success,
        failed,
        successRate: items.length > 0 ? (success / items.length) * 100 : 0,
        avgDuration,
      };
    });
  }, [executions]);

  const maxTotal = Math.max(...agentStats.map((s) => s.total), 1);

  if (agentStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Stats</CardTitle>
          <CardDescription>Agent performance by type</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No execution data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution Stats</CardTitle>
        <CardDescription>Agent performance by type</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bar chart */}
        <div className="space-y-4">
          {agentStats.map((stat) => (
            <div key={stat.agentType} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stat.label}</span>
                <span className="text-muted-foreground">
                  {stat.total} runs
                </span>
              </div>
              <div className="flex h-6 w-full overflow-hidden rounded-md bg-muted/50">
                <div
                  className={`${BAR_COLORS.success} transition-all duration-300`}
                  style={{
                    width: `${(stat.success / maxTotal) * 100}%`,
                  }}
                  title={`${stat.success} succeeded`}
                />
                <div
                  className={`${BAR_COLORS.failed} transition-all duration-300`}
                  style={{
                    width: `${(stat.failed / maxTotal) * 100}%`,
                  }}
                  title={`${stat.failed} failed`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary table */}
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border text-center text-xs">
          <div className="bg-muted/50 px-2 py-1.5 font-medium">Agent</div>
          <div className="bg-muted/50 px-2 py-1.5 font-medium">Success Rate</div>
          <div className="bg-muted/50 px-2 py-1.5 font-medium">Avg Time</div>
          {agentStats.map((stat) => (
            <div key={stat.agentType} className="contents">
              <div className="border-t px-2 py-1.5">{stat.label}</div>
              <div className="border-t px-2 py-1.5">
                <span
                  className={
                    stat.successRate >= 80
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : stat.successRate >= 50
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }
                >
                  {stat.successRate.toFixed(0)}%
                </span>
              </div>
              <div className="border-t px-2 py-1.5 text-muted-foreground">
                {formatMs(stat.avgDuration)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
