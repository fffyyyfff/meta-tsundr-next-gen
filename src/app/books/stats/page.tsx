'use client';

import Link from 'next/link';
import { trpcReact } from '@/shared/lib/trpc-provider';
import { StatCard, StatusPieChart, MonthlyBarChart } from '@/features/books/components/reading-stats';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { ArrowLeftIcon } from 'lucide-react';

const MONTHLY_GOAL = 5;

export default function BookStatsPage() {
  const statsQuery = trpcReact.book.stats.useQuery();
  const analyticsQuery = trpcReact.book.readingAnalytics.useQuery();

  const isLoading = statsQuery.isLoading || analyticsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const stats = statsQuery.data;
  const analytics = analyticsQuery.data;

  if (!stats) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 text-center text-muted-foreground">
        統計データを取得できませんでした
      </div>
    );
  }

  const finishedRate = stats.total > 0
    ? Math.round((stats.byStatus.FINISHED / stats.total) * 100)
    : 0;

  const goalRate = Math.min(100, Math.round((stats.finishedThisMonth / MONTHLY_GOAL) * 100));

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">読書統計</h1>
          <p className="text-muted-foreground">あなたの読書データを可視化</p>
        </div>
        <Button variant="ghost" size="sm" render={<Link href="/books" />}>
          <ArrowLeftIcon className="size-4 mr-1" />
          一覧に戻る
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="合計" value={`${stats.total}冊`} />
        <StatCard
          label="読了率"
          value={`${finishedRate}%`}
          description={`${stats.byStatus.FINISHED}/${stats.total}冊`}
        />
        <StatCard
          label="平均読書期間"
          value={analytics?.avgReadingDays != null ? `${analytics.avgReadingDays}日` : '-'}
          description="開始→読了"
        />
        <StatCard
          label="今月の目標"
          value={`${goalRate}%`}
          description={`${stats.finishedThisMonth}/${MONTHLY_GOAL}冊読了`}
        />
      </div>

      {/* Status breakdown cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="積読" value={`${stats.byStatus.UNREAD}冊`} className="border-l-4 border-l-gray-400" />
        <StatCard label="読書中" value={`${stats.byStatus.READING}冊`} className="border-l-4 border-l-blue-500" />
        <StatCard label="読了" value={`${stats.byStatus.FINISHED}冊`} className="border-l-4 border-l-emerald-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusPieChart byStatus={stats.byStatus} />
        {analytics?.monthlyData && <MonthlyBarChart data={analytics.monthlyData} />}
      </div>

      {/* Goal progress bar */}
      <div className="rounded-lg border border-border p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">今月の読書目標</span>
          <span className="text-muted-foreground">{stats.finishedThisMonth}/{MONTHLY_GOAL}冊</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${goalRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
