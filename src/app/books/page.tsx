'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { trpcReact } from '@/lib/trpc-provider';
import { useBookStore } from '@/stores/bookStore';
import { BookCard } from '@/components/book-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon, SearchIcon } from 'lucide-react';

const TABS = [
  { value: 'all', label: '全て' },
  { value: 'UNREAD', label: '積読' },
  { value: 'READING', label: '読書中' },
  { value: 'FINISHED', label: '読了' },
] as const;

const SORT_OPTIONS = [
  { value: 'createdAt', label: '追加日' },
  { value: 'title', label: 'タイトル' },
  { value: 'author', label: '著者' },
  { value: 'updatedAt', label: '更新日' },
] as const;

export default function BooksPage() {
  const { activeFilter, searchQuery, sortBy, sortOrder, setActiveFilter, setSearchQuery, setSortBy, setSortOrder } = useBookStore();

  const queryInput = {
    ...(activeFilter && { status: activeFilter }),
    ...(searchQuery && { search: searchQuery }),
    sortBy: sortBy as 'title' | 'author' | 'createdAt' | 'updatedAt',
    sortOrder,
  };

  const booksQuery = trpcReact.book.list.useQuery(queryInput);
  const utils = trpcReact.useUtils();

  const updateMutation = trpcReact.book.update.useMutation({
    onSuccess: () => utils.book.list.invalidate(),
  });

  const deleteMutation = trpcReact.book.delete.useMutation({
    onSuccess: () => utils.book.list.invalidate(),
  });

  const handleStatusChange = useCallback(
    (id: string, status: 'UNREAD' | 'READING' | 'FINISHED') => {
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

  const handleTabChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      setActiveFilter(value === 'all' ? null : (value as 'UNREAD' | 'READING' | 'FINISHED'));
    },
    [setActiveFilter],
  );

  const books = booksQuery.data?.items ?? [];
  const totalCount = books.length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">積読管理</h1>
          <p className="text-muted-foreground">あなたの読書記録 ({totalCount}冊)</p>
        </div>
        <Button render={<Link href="/books/new" />}>
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
            placeholder="タイトル・著者で検索..."
            className="pl-9"
            aria-label="書籍を検索"
          />
        </div>
        <div className="flex items-center gap-2">
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

      {/* Tabs */}
      <Tabs value={activeFilter ?? 'all'} onValueChange={handleTabChange}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Single content area for all tabs */}
        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {booksQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg text-muted-foreground">
                  {searchQuery ? '検索結果がありません' : 'まだ書籍が登録されていません'}
                </p>
                {!searchQuery && (
                  <Button variant="outline" className="mt-4" render={<Link href="/books/new" />}>
                    <PlusIcon className="size-4 mr-1" />
                    最初の一冊を追加
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={{ ...book, createdAt: book.createdAt.toString() }}
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
