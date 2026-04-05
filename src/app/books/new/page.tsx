'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpcReact } from '@/shared/lib/trpc-provider';
import { BookForm } from '@/features/books/components/book-form';
import { Button } from '@/shared/ui/button';
import { ArrowLeftIcon, LayersIcon } from 'lucide-react';

export default function NewBookPage() {
  const router = useRouter();

  const createMutation = trpcReact.book.create.useMutation({
    onSuccess: () => {
      router.push('/books');
    },
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/books" />}>
        <ArrowLeftIcon className="size-4 mr-1" />
        書籍一覧に戻る
      </Button>

      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        <p>
          シリーズをまとめて追加する場合は
          <Button variant="link" size="sm" className="px-1" render={<Link href="/books" />}>
            <LayersIcon className="size-3.5 mr-0.5" />
            一括登録
          </Button>
          をご利用ください
        </p>
      </div>

      <BookForm
        onSubmit={(data) => {
          createMutation.mutate({
            ...data,
            isbn: data.isbn || undefined,
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
