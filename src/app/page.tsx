'use client';

import { BookOpenIcon, BarChart3Icon, ShieldIcon, BookMarkedIcon, BookCheckIcon, Loader2Icon, PackageIcon, HeartIcon } from 'lucide-react';
import { trpcReact } from '@/lib/trpc-provider';
import { BentoGrid, BentoCard } from '@/components/bento-grid';

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
        <div key={item.label} className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            {item.label}
          </div>
          <p className="mt-1 text-2xl font-bold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-display">Meta-tsundr</h1>
        <p className="text-lg text-muted-foreground">
          積読管理 & AI読書アシスタント
        </p>
      </div>

      {/* Bento Grid */}
      <BentoGrid>
        <BentoCard
          title="積読管理"
          description="あなたの読書記録を管理"
          href="/books"
          icon={BookOpenIcon}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          className="md:row-span-2"
        />
        <BentoCard
          title="読書統計"
          description="読書の傾向を分析"
          href="/books/stats"
          icon={BarChart3Icon}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <BentoCard
          title="購入管理"
          description="購入・ウィッシュリストを管理"
          href="/purchases"
          icon={PackageIcon}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
        />
        <BentoCard
          title="ウィッシュリスト"
          description="欲しいものリスト"
          href="/purchases?status=WISHLIST"
          icon={HeartIcon}
          iconColor="text-rose-500"
          iconBg="bg-rose-500/10"
        />
        <BentoCard
          title="AI ダッシュボード"
          description="AIエージェント管理"
          href="/dashboard"
          icon={ShieldIcon}
          iconColor="text-violet-500"
          iconBg="bg-violet-500/10"
          badge="管理者"
        />
      </BentoGrid>

      {/* Activity Summary */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">読書アクティビティ</h2>
        <ActivitySummary />
      </section>
    </div>
  );
}
