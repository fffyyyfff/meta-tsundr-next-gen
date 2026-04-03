'use client';

import { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { trpcReact } from '@/shared/lib/trpc-provider';
import { CategoryIcon, getCategoryLabel } from '@/features/purchases/components/category-icon';
import { ItemStatusBadge } from '@/features/purchases/components/item-status-badge';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  ShoppingCartIcon,
  PlayIcon,
  CheckCircleIcon,
  Undo2Icon,
} from 'lucide-react';

type ItemStatus = 'WISHLIST' | 'PURCHASED' | 'IN_USE' | 'COMPLETED' | 'RETURNED';

const STATUS_ACTIONS: Array<{ status: ItemStatus; label: string; icon: typeof HeartIcon }> = [
  { status: 'WISHLIST', label: '欲しい', icon: HeartIcon },
  { status: 'PURCHASED', label: '購入済み', icon: ShoppingCartIcon },
  { status: 'IN_USE', label: '使用中', icon: PlayIcon },
  { status: 'COMPLETED', label: '完了', icon: CheckCircleIcon },
  { status: 'RETURNED', label: '返品', icon: Undo2Icon },
];

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

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '-';
  return `\u00A5${price.toLocaleString()}`;
}

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const itemQuery = trpcReact.item.getById.useQuery({ id });
  const utils = trpcReact.useUtils();

  const updateMutation = trpcReact.item.update.useMutation({
    onSuccess: () => {
      utils.item.getById.invalidate({ id });
    },
  });

  const deleteMutation = trpcReact.item.delete.useMutation({
    onSuccess: () => {
      router.push('/purchases');
    },
  });

  const handleStatusChange = useCallback(
    (status: ItemStatus) => {
      updateMutation.mutate({ id, status });
    },
    [id, updateMutation],
  );

  const handleDelete = useCallback(() => {
    if (confirm('このアイテムを削除しますか？')) {
      deleteMutation.mutate({ id });
    }
  }, [id, deleteMutation]);

  if (itemQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (itemQuery.error || !itemQuery.data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-muted-foreground">アイテムが見つかりません</p>
        <Button variant="outline" className="mt-4" render={<Link href="/purchases" />}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  const item = itemQuery.data;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/purchases" />}>
        <ArrowLeftIcon className="size-4 mr-1" />
        購入一覧に戻る
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={160}
                height={213}
                className="rounded-md object-cover"
                style={{ width: 160, height: 213 }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-md bg-muted"
                style={{ width: 160, height: 213 }}
              >
                <CategoryIcon category={item.category} className="size-12 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <div className="flex items-center gap-1.5 mb-1 justify-center sm:justify-start">
                  <CategoryIcon category={item.category} className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{getCategoryLabel(item.category)}</span>
                </div>
                <h1 className="text-xl font-bold">{item.title}</h1>
                {item.creator && <p className="text-muted-foreground">{item.creator}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <ItemStatusBadge status={item.status} />
                {item.source && (
                  <Badge variant="outline">
                    {item.source === 'amazon' ? 'Amazon' : item.source === 'rakuten' ? '楽天' : item.source}
                  </Badge>
                )}
                <StarDisplay rating={item.rating} />
              </div>

              <p className="text-lg font-semibold">{formatPrice(item.price)}</p>

              {item.externalId && (
                <p className="text-xs text-muted-foreground">商品コード: {item.externalId}</p>
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
              <p>{formatDate(item.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">更新日</p>
              <p>{formatDate(item.updatedAt)}</p>
            </div>
          </div>

          {item.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">メモ</p>
              <div className="rounded-md bg-muted/50 p-3">
                <pre className="whitespace-pre-wrap break-words text-sm">{item.notes}</pre>
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
            {STATUS_ACTIONS.map((action) => (
              <Button
                key={action.status}
                variant={item.status === action.status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(action.status)}
                disabled={updateMutation.isPending}
              >
                <action.icon className="size-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" render={<Link href={`/purchases/${item.id}/edit`} />}>
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
