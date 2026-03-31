'use client';

import { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpcReact } from '@/lib/trpc-provider';
import { BookCover } from '@/components/book-cover';
import { BookStatusBadge } from '@/components/book-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon, PencilIcon, TrashIcon, BookOpenIcon, BookCheckIcon, BookMarkedIcon } from 'lucide-react';
import { AiReview } from '@/components/ai-book-features';

function StarDisplay({ rating }: { rating: number | null | undefined }) {
  if (!rating) return <span className="text-sm text-muted-foreground">未評価</span>;
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating}つ星`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-base ${i < rating ? 'text-yellow-500' : 'text-muted-foreground/30'}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const bookQuery = trpcReact.book.getById.useQuery({ id });
  const utils = trpcReact.useUtils();

  const updateMutation = trpcReact.book.update.useMutation({
    onSuccess: () => {
      utils.book.getById.invalidate({ id });
    },
  });

  const deleteMutation = trpcReact.book.delete.useMutation({
    onSuccess: () => {
      router.push('/books');
    },
  });

  const handleStatusChange = useCallback(
    (status: 'UNREAD' | 'READING' | 'FINISHED') => {
      updateMutation.mutate({ id, status });
    },
    [id, updateMutation],
  );

  const handleDelete = useCallback(() => {
    if (confirm('この書籍を削除しますか？')) {
      deleteMutation.mutate({ id });
    }
  }, [id, deleteMutation]);

  if (bookQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (bookQuery.error || !bookQuery.data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-muted-foreground">書籍が見つかりません</p>
        <Button variant="outline" className="mt-4" render={<Link href="/books" />}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  const book = bookQuery.data;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/books" />}>
        <ArrowLeftIcon className="size-4 mr-1" />
        書籍一覧に戻る
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <BookCover title={book.title} imageUrl={book.imageUrl} width={160} height={213} />

            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <h1 className="text-xl font-bold">{book.title}</h1>
                <p className="text-muted-foreground">{book.author}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <BookStatusBadge status={book.status} />
                <StarDisplay rating={book.rating} />
              </div>

              {book.isbn && (
                <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">詳細情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">追加日</p>
              <p>{formatDate(book.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">読書開始日</p>
              <p>{formatDate(book.startedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">読了日</p>
              <p>{formatDate(book.finishedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">更新日</p>
              <p>{formatDate(book.updatedAt)}</p>
            </div>
          </div>

          {book.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">メモ</p>
              <div className="rounded-md bg-muted/50 p-3">
                <pre className="whitespace-pre-wrap break-words text-sm">{book.notes}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status change buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ステータス変更</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={book.status === 'UNREAD' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('UNREAD')}
              disabled={updateMutation.isPending}
            >
              <BookMarkedIcon className="size-4 mr-1" />
              積読
            </Button>
            <Button
              variant={book.status === 'READING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('READING')}
              disabled={updateMutation.isPending}
            >
              <BookOpenIcon className="size-4 mr-1" />
              読書中
            </Button>
            <Button
              variant={book.status === 'FINISHED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('FINISHED')}
              disabled={updateMutation.isPending}
            >
              <BookCheckIcon className="size-4 mr-1" />
              読了
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Review */}
      <AiReview bookId={book.id} />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" render={<Link href={`/books/${book.id}/edit`} />}>
          <PencilIcon className="size-4 mr-1" />
          編集
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
          <TrashIcon className="size-4 mr-1" />
          削除
        </Button>
      </div>
    </div>
  );
}
