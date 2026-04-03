'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpcReact } from '@/shared/lib/trpc-provider';
import { ItemForm } from '@/features/purchases/components/item-form';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeftIcon } from 'lucide-react';

export default function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const itemQuery = trpcReact.item.getById.useQuery({ id });
  const utils = trpcReact.useUtils();

  const updateMutation = trpcReact.item.update.useMutation({
    onSuccess: () => {
      utils.item.getById.invalidate({ id });
      router.push(`/purchases/${id}`);
    },
  });

  if (itemQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 rounded-xl" />
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
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Button variant="ghost" size="sm" render={<Link href={`/purchases/${id}`} />}>
        <ArrowLeftIcon className="size-4 mr-1" />
        詳細に戻る
      </Button>

      <ItemForm
        defaultValues={{
          category: item.category as 'BOOK' | 'ELECTRONICS' | 'DAILY_GOODS' | 'FOOD' | 'CLOTHING' | 'HOBBY' | 'OTHER',
          title: item.title,
          creator: item.creator ?? '',
          externalId: item.externalId ?? '',
          price: item.price ?? null,
          status: item.status as 'WISHLIST' | 'PURCHASED' | 'IN_USE' | 'COMPLETED' | 'RETURNED',
          source: item.source ?? '',
          imageUrl: item.imageUrl ?? '',
          notes: item.notes ?? '',
          rating: item.rating ?? null,
        }}
        onSubmit={(data) => {
          updateMutation.mutate({
            id,
            ...data,
            creator: data.creator || undefined,
            externalId: data.externalId || undefined,
            price: data.price,
            source: data.source || undefined,
            notes: data.notes || undefined,
            rating: data.rating,
          });
        }}
        isSubmitting={updateMutation.isPending}
        submitLabel="更新する"
      />

      {updateMutation.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-300">{updateMutation.error.message}</p>
        </div>
      )}
    </div>
  );
}
