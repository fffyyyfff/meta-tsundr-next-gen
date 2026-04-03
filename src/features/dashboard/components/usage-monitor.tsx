'use client';

import { useState } from 'react';
import { Activity, Zap, DollarSign, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { trpcReact } from '@/shared/lib/trpc-provider';

type Period = 'day' | 'week' | 'month';

const periodLabels: Record<Period, string> = {
  day: '今日',
  week: '今週',
  month: '今月',
};

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function UsageMonitor() {
  const [period, setPeriod] = useState<Period>('day');

  const { data: summary, isLoading } = trpcReact.usage.getUsageSummary.useQuery(
    { period },
    { refetchInterval: 30_000 },
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">API Usage</CardTitle>
        <div className="flex gap-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !summary ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Activity className="h-4 w-4 text-blue-500" />}
              label="API呼び出し"
              value={String(summary.totalCalls)}
            />
            <StatCard
              icon={<Zap className="h-4 w-4 text-amber-500" />}
              label="トークン消費"
              value={formatTokens(summary.totalInputTokens + summary.totalOutputTokens)}
              sub={`In: ${formatTokens(summary.totalInputTokens)} / Out: ${formatTokens(summary.totalOutputTokens)}`}
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4 text-green-500" />}
              label="推定コスト"
              value={`$${summary.estimatedCostUsd.toFixed(2)}`}
            />
            <StatCard
              icon={<Clock className="h-4 w-4 text-violet-500" />}
              label="平均応答時間"
              value={`${summary.avgResponseTimeMs}ms`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
