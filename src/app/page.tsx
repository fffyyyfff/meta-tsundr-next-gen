'use client';

import Link from 'next/link';
import { BookOpenIcon, BarChart3Icon, ShieldIcon, BookMarkedIcon, BookCheckIcon, Loader2Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { trpcReact } from '@/lib/trpc-provider';

const MENU_CARDS: Array<{
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpenIcon;
  color: string;
  bg: string;
  badge?: string;
}> = [
  {
    title: '積読管理',
    description: 'あなたの読書記録を管理',
    href: '/books',
    icon: BookOpenIcon,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    title: '読書統計',
    description: '読書の傾向を分析',
    href: '/books/stats',
    icon: BarChart3Icon,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'AI ダッシュボード',
    description: 'AIエージェント管理',
    href: '/dashboard',
    icon: ShieldIcon,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    badge: '管理者',
  },
];

function ActivitySummary() {
  const { data, isLoading } = trpcReact.book.stats.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const items = [
    { label: '登録冊数', value: data.total, icon: BookOpenIcon, color: 'text-blue-500' },
    { label: '読書中', value: data.byStatus.READING, icon: BookMarkedIcon, color: 'text-amber-500' },
    { label: '読了', value: data.byStatus.FINISHED, icon: BookCheckIcon, color: 'text-emerald-500' },
    { label: '今月追加', value: data.addedThisMonth, icon: BookOpenIcon, color: 'text-violet-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              {item.label}
            </div>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Meta-tsundr</h1>
        <p className="text-lg text-muted-foreground">
          積読管理 & AI読書アシスタント
        </p>
      </div>

      {/* Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MENU_CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  {card.badge && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                      {card.badge}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base group-hover:underline">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Activity Summary */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">読書アクティビティ</h2>
        <ActivitySummary />
      </section>
    </div>
  );
}
