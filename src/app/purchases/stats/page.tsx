'use client';

import Link from 'next/link';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { PieLabelRenderProps } from 'recharts';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { trpcReact } from '@/shared/lib/trpc-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  MonitorIcon,
  ShoppingBagIcon,
  UtensilsIcon,
  ShirtIcon,
  GamepadIcon,
  PackageIcon,
  HeartIcon,
  ShoppingCartIcon,
  PlayIcon,
  CheckCircleIcon,
  RotateCcwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from 'lucide-react';

// ---------- Types ----------

type ItemCategory = 'BOOK' | 'ELECTRONICS' | 'DAILY_GOODS' | 'FOOD' | 'CLOTHING' | 'HOBBY' | 'OTHER';
type ItemStatus = 'WISHLIST' | 'PURCHASED' | 'IN_USE' | 'COMPLETED' | 'RETURNED';

interface StatsData {
  byCategory: Record<string, { total: number; count: number }>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  monthlySpending: Array<{ month: string; amount: number }>;
  totalSpending: number;
  thisMonthSpending: number;
  lastMonthSpending: number;
}

// ---------- Constants ----------

const CATEGORY_META: Record<ItemCategory, { label: string; icon: typeof BookOpenIcon; color: string }> = {
  BOOK: { label: '書籍', icon: BookOpenIcon, color: '#3b82f6' },
  ELECTRONICS: { label: '家電', icon: MonitorIcon, color: '#8b5cf6' },
  DAILY_GOODS: { label: '日用品', icon: ShoppingBagIcon, color: '#f59e0b' },
  FOOD: { label: '食品', icon: UtensilsIcon, color: '#ef4444' },
  CLOTHING: { label: '衣類', icon: ShirtIcon, color: '#ec4899' },
  HOBBY: { label: '趣味', icon: GamepadIcon, color: '#10b981' },
  OTHER: { label: 'その他', icon: PackageIcon, color: '#6b7280' },
};

const STATUS_META: Record<ItemStatus, { label: string; icon: typeof HeartIcon; color: string }> = {
  WISHLIST: { label: '欲しい', icon: HeartIcon, color: '#ec4899' },
  PURCHASED: { label: '購入済み', icon: ShoppingCartIcon, color: '#3b82f6' },
  IN_USE: { label: '使用中', icon: PlayIcon, color: '#f59e0b' },
  COMPLETED: { label: '完了', icon: CheckCircleIcon, color: '#10b981' },
  RETURNED: { label: '返品', icon: RotateCcwIcon, color: '#6b7280' },
};

const CATEGORY_COLORS = Object.values(CATEGORY_META).map((m) => m.color);

const SOURCE_COLORS: Record<string, string> = {
  Amazon: '#ff9900',
  楽天: '#bf0000',
  店舗: '#10b981',
};

// ---------- Helpers ----------

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

function monthLabel(month: string): string {
  const parts = month.split('-');
  const m = parts[1];
  if (!m) return month;
  return `${parseInt(m, 10)}月`;
}

// ---------- Sub-components ----------

function CategoryCards({ byCategory }: { byCategory: StatsData['byCategory'] }) {
  const categories = Object.keys(CATEGORY_META) as ItemCategory[];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((cat) => {
        const meta = CATEGORY_META[cat];
        const data = byCategory[cat];
        const total = data?.total ?? 0;
        const count = data?.count ?? 0;
        const Icon = meta.icon;
        return (
          <Card key={cat}>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="size-4" style={{ color: meta.color }} />
                <p className="text-xs text-muted-foreground">{meta.label}</p>
              </div>
              <p className="text-xl font-bold">{formatYen(total)}</p>
              <p className="text-xs text-muted-foreground">{count}件</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatusCards({ byStatus }: { byStatus: StatsData['byStatus'] }) {
  const statuses = Object.keys(STATUS_META) as ItemStatus[];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statuses.map((st) => {
        const meta = STATUS_META[st];
        const count = byStatus[st] ?? 0;
        const Icon = meta.icon;
        return (
          <Card key={st} className="border-l-4" style={{ borderLeftColor: meta.color }}>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="size-4" style={{ color: meta.color }} />
                <p className="text-xs text-muted-foreground">{meta.label}</p>
              </div>
              <p className="text-2xl font-bold">{count}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MonthlySpendingChart({ data }: { data: StatsData['monthlySpending'] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: monthLabel(d.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">月別支出推移</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value?: ValueType) => [formatYen(Number(value ?? 0)), '支出']} />
            <Bar dataKey="amount" name="支出" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CategoryPieChart({ byCategory }: { byCategory: StatsData['byCategory'] }) {
  const categories = Object.keys(CATEGORY_META) as ItemCategory[];
  const data = categories
    .map((cat) => ({
      name: CATEGORY_META[cat].label,
      value: byCategory[cat]?.total ?? 0,
      category: cat,
    }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">カテゴリ別支出割合</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">カテゴリ別支出割合</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              label={(props: PieLabelRenderProps) =>
                `${String(props.name ?? '')} ${formatYen(Number(props.value ?? 0))}`
              }
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value?: ValueType) => formatYen(Number(value ?? 0))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SourceDonutChart({ bySource }: { bySource: StatsData['bySource'] }) {
  const data = Object.entries(bySource)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">購入元別</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">購入元別</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              label={(props: PieLabelRenderProps) =>
                `${String(props.name ?? '')} ${formatYen(Number(props.value ?? 0))}`
              }
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={SOURCE_COLORS[entry.name] ?? '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value?: ValueType) => formatYen(Number(value ?? 0))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------

export default function PurchaseStatsPage() {
  const statsQuery = trpcReact.item.stats.useQuery();

  if (statsQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = statsQuery.data as StatsData | undefined;

  if (!stats) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 text-center text-muted-foreground">
        統計データを取得できませんでした
      </div>
    );
  }

  const momDiff = stats.thisMonthSpending - stats.lastMonthSpending;
  const momPercent =
    stats.lastMonthSpending > 0
      ? Math.round((momDiff / stats.lastMonthSpending) * 100)
      : stats.thisMonthSpending > 0
        ? 100
        : 0;
  const isMomUp = momDiff >= 0;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">購入統計</h1>
          <p className="text-muted-foreground">あなたの購入データを可視化</p>
        </div>
        <Button variant="ghost" size="sm" render={<Link href="/purchases" />}>
          <ArrowLeftIcon className="size-4 mr-1" />
          一覧に戻る
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">累計支出</p>
            <p className="text-2xl font-bold">{formatYen(stats.totalSpending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">今月の支出</p>
            <p className="text-2xl font-bold">{formatYen(stats.thisMonthSpending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">前月比</p>
            <div className="flex items-center gap-2">
              {isMomUp ? (
                <TrendingUpIcon className="size-5 text-red-500" />
              ) : (
                <TrendingDownIcon className="size-5 text-emerald-500" />
              )}
              <p className="text-2xl font-bold">
                {isMomUp ? '+' : ''}{momPercent}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              先月: {formatYen(stats.lastMonthSpending)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category spending cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">カテゴリ別支出</h2>
        <CategoryCards byCategory={stats.byCategory} />
      </div>

      {/* Status cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">ステータス別件数</h2>
        <StatusCards byStatus={stats.byStatus} />
      </div>

      {/* Monthly spending chart */}
      <MonthlySpendingChart data={stats.monthlySpending} />

      {/* Pie + Donut charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryPieChart byCategory={stats.byCategory} />
        <SourceDonutChart bySource={stats.bySource} />
      </div>
    </div>
  );
}
