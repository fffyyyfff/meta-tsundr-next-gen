'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpcReact } from '@/lib/trpc-provider';
import { BookForm } from '@/components/book-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon } from 'lucide-react';

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const bookQuery = trpcReact.book.getById.useQuery({ id });
  const utils = trpcReact.useUtils();

  const updateMutation = trpcReact.book.update.useMutation({
    onSuccess: () => {
      utils.book.getById.invalidate({ id });
      router.push(`/books/${id}`);
    },
  });

  if (bookQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 rounded-xl" />
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
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Button variant="ghost" size="sm" render={<Link href={`/books/${id}`} />}>
        <ArrowLeftIcon className="size-4 mr-1" />
        詳細に戻る
      </Button>

      <BookForm
        defaultValues={{
          title: book.title,
          author: book.author,
          isbn: book.isbn ?? '',
          status: book.status as 'UNREAD' | 'READING' | 'FINISHED',
          notes: book.notes ?? '',
          rating: book.rating ?? null,
        }}
        onSubmit={(data) => {
          updateMutation.mutate({
            id,
            ...data,
            isbn: data.isbn || undefined,
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
