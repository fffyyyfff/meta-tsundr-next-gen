'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpcReact } from '@/shared/lib/trpc-provider';
import { ItemForm } from '@/features/purchases/components/item-form';
import { Button } from '@/shared/ui/button';
import { ArrowLeftIcon } from 'lucide-react';

export default function NewPurchasePage() {
  const router = useRouter();

  const createMutation = trpcReact.item.create.useMutation({
    onSuccess: () => {
      router.push('/purchases');
    },
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/purchases" />}>
        <ArrowLeftIcon className="size-4 mr-1" />
        購入一覧に戻る
      </Button>

      <ItemForm
        onSubmit={(data) => {
          createMutation.mutate({
            ...data,
            creator: data.creator || undefined,
            externalId: data.externalId || undefined,
            price: data.price ?? undefined,
            source: data.source || undefined,
            notes: data.notes || undefined,
            rating: data.rating ?? undefined,
          });
        }}
        isSubmitting={createMutation.isPending}
        submitLabel="追加する"
      />

      {createMutation.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-300">{createMutation.error.message}</p>
        </div>
      )}
    </div>
  );
}
