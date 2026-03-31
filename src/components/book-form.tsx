'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpcReact } from '@/lib/trpc-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchIcon } from 'lucide-react';

const bookFormSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  author: z.string().min(1, '著者は必須です'),
  isbn: z.string().optional(),
  status: z.enum(['UNREAD', 'READING', 'FINISHED']),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).nullable(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

const STATUS_OPTIONS = [
  { value: 'UNREAD', label: '積読' },
  { value: 'READING', label: '読書中' },
  { value: 'FINISHED', label: '読了' },
] as const;

interface BookFormProps {
  defaultValues?: Partial<BookFormValues>;
  onSubmit: (data: BookFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

function StarInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="評価">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const active = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(value === star ? null : star)}
            className={`text-lg transition-colors ${active ? 'text-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-300'}`}
            aria-label={`${star}つ星`}
            role="radio"
            aria-checked={value === star}
          >
            ★
          </button>
        );
      })}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs text-muted-foreground hover:text-foreground"
        >
          クリア
        </button>
      )}
    </div>
  );
}

export function BookForm({ defaultValues, onSubmit, isSubmitting, submitLabel = '保存' }: BookFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      author: '',
      isbn: '',
      status: 'UNREAD',
      notes: '',
      rating: null,
      ...defaultValues,
    },
  });

  const isbn = watch('isbn');
  const [lookupLoading, setLookupLoading] = useState(false);
  const utils = trpcReact.useUtils();

  const handleIsbnLookup = async () => {
    const trimmed = isbn?.trim();
    if (!trimmed || trimmed.length < 10) return;
    setLookupLoading(true);
    try {
      const result = await utils.book.lookupIsbn.fetch({ isbn: trimmed });
      if (result) {
        if (result.title) setValue('title', result.title);
        if (result.author) setValue('author', result.author);
      }
    } catch {
      // ISBNルックアップ失敗は無視
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultValues?.title ? '書籍を編集' : '新しい書籍を追加'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ISBN + lookup */}
          <div className="space-y-1">
            <Label htmlFor="isbn">ISBN</Label>
            <div className="flex gap-2">
              <Input
                id="isbn"
                {...register('isbn')}
                placeholder="978-..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleIsbnLookup} disabled={lookupLoading} aria-label="ISBNで検索">
                <SearchIcon className="size-4 mr-1" />
                {lookupLoading ? '検索中...' : '検索'}
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title">タイトル *</Label>
            <Input id="title" {...register('title')} placeholder="本のタイトル" aria-invalid={!!errors.title} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Author */}
          <div className="space-y-1">
            <Label htmlFor="author">著者 *</Label>
            <Input id="author" {...register('author')} placeholder="著者名" aria-invalid={!!errors.author} />
            {errors.author && <p className="text-xs text-destructive">{errors.author.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label htmlFor="status">ステータス</Label>
            <select
              id="status"
              {...register('status')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="space-y-1">
            <Label>評価</Label>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <StarInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">メモ</Label>
            <Textarea id="notes" {...register('notes')} placeholder="感想やメモ..." rows={4} />
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? '保存中...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
