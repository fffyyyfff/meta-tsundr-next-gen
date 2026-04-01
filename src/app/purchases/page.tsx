'use client';

import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trpcReact } from '@/lib/trpc-provider';
import { useItemStore } from '@/stores/itemStore';
import { ItemCard } from '@/components/item-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon, SearchIcon } from 'lucide-react';

type ItemCategory = 'BOOK' | 'ELECTRONICS' | 'DAILY_GOODS' | 'FOOD' | 'CLOTHING' | 'HOBBY' | 'OTHER';
type ItemStatus = 'WISHLIST' | 'PURCHASED' | 'IN_USE' | 'COMPLETED' | 'RETURNED';

const CATEGORY_TABS = [
  { value: 'all', label: '全て' },
  { value: 'BOOK', label: '書籍' },
  { value: 'ELECTRONICS', label: '家電' },
  { value: 'DAILY_GOODS', label: '日用品' },
  { value: 'FOOD', label: '食品' },
  { value: 'CLOTHING', label: '衣類' },
  { value: 'HOBBY', label: '趣味' },
  { value: 'OTHER', label: 'その他' },
] as const;

const STATUS_FILTERS = [
  { value: 'all', label: '全ステータス' },
  { value: 'WISHLIST', label: '欲しい' },
  { value: 'PURCHASED', label: '購入済み' },
  { value: 'IN_USE', label: '使用中' },
  { value: 'COMPLETED', label: '完了' },
  { value: 'RETURNED', label: '返品' },
] as const;

const SORT_OPTIONS = [
  { value: 'createdAt', label: '追加日' },
  { value: 'title', label: 'タイトル' },
  { value: 'price', label: '価格' },
  { value: 'updatedAt', label: '更新日' },
] as const;

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const {
    activeCategory, activeStatus, searchQuery, sortBy, sortOrder,
    setActiveCategory, setActiveStatus, setSearchQuery, setSortBy, setSortOrder,
  } = useItemStore();

  // Apply URL params on mount
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && STATUS_FILTERS.some((f) => f.value === urlStatus)) {
      setActiveStatus(urlStatus as ItemStatus);
    }
  }, [searchParams, setActiveStatus]);

  const queryInput = {
    ...(activeCategory && { category: activeCategory }),
    ...(activeStatus && { status: activeStatus }),
    ...(searchQuery && { search: searchQuery }),
    sortBy: sortBy as 'title' | 'price' | 'createdAt' | 'updatedAt',
    sortOrder,
  };

  const itemsQuery = trpcReact.item.list.useQuery(queryInput);
  const utils = trpcReact.useUtils();

  const updateMutation = trpcReact.item.update.useMutation({
    onSuccess: () => utils.item.list.invalidate(),
  });

  const deleteMutation = trpcReact.item.delete.useMutation({
    onSuccess: () => utils.item.list.invalidate(),
  });

  const handleStatusChange = useCallback(
    (id: string, status: ItemStatus) => {
      updateMutation.mutate({ id, status });
    },
    [updateMutation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate({ id });
    },
    [deleteMutation],
  );

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      setActiveCategory(value === 'all' ? null : (value as ItemCategory));
    },
    [setActiveCategory],
  );

  const items = (itemsQuery.data?.items ?? []) as unknown as Array<{
    id: string;
    category: string;
    title: string;
    creator: string | null;
    status: string;
    imageUrl: string | null;
    price: number | null;
    source: string | null;
    rating: number | null;
    createdAt: string;
    updatedAt: string;
  }>;
  const totalCount = items.length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">購入管理</h1>
          <p className="text-muted-foreground">あなたの購入記録 ({totalCount}件)</p>
        </div>
        <Button render={<Link href="/purchases/new" />}>
          <PlusIcon className="size-4 mr-1" />
          追加
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="タイトル・メーカーで検索..."
            className="pl-9"
            aria-label="アイテムを検索"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={activeStatus ?? 'all'}
            onChange={(e) => setActiveStatus(e.target.value === 'all' ? null : (e.target.value as ItemStatus))}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="ステータスフィルター"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="並び替え"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            aria-label={sortOrder === 'asc' ? '降順に変更' : '昇順に変更'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory ?? 'all'} onValueChange={handleCategoryChange}>
        <TabsList>
          {CATEGORY_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORY_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {itemsQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg text-muted-foreground">
                  {searchQuery ? '検索結果がありません' : 'まだアイテムが登録されていません'}
                </p>
                {!searchQuery && (
                  <Button variant="outline" className="mt-4" render={<Link href="/purchases/new" />}>
                    <PlusIcon className="size-4 mr-1" />
                    最初のアイテムを追加
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={{
                      id: item.id,
                      category: item.category,
                      title: item.title,
                      creator: item.creator,
                      status: item.status,
                      imageUrl: item.imageUrl,
                      price: item.price,
                      source: item.source,
                      rating: item.rating,
                      createdAt: item.createdAt.toString(),
                    }}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
