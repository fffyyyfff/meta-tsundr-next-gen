'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpcReact } from '@/lib/trpc-provider';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchIcon, Loader2Icon, CalendarIcon, XIcon } from 'lucide-react';

const bookFormSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  author: z.string().min(1, '著者は必須です'),
  isbn: z.string().optional(),
  status: z.enum(['UNREAD', 'READING', 'FINISHED']),
  imageUrl: z.string().optional(),
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
    reset,
    formState: { errors },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      author: '',
      isbn: '',
      status: 'UNREAD',
      imageUrl: '',
      notes: '',
      rating: null,
      ...defaultValues,
    },
  });

  const isbn = watch('isbn');
  const titleValue = watch('title');
  const authorValue = watch('author');
  const notesValue = watch('notes');
  const ratingValue = watch('rating');
  const imageUrl = watch('imageUrl');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isbnPreview, setIsbnPreview] = useState<{ title: string; author: string; coverUrl: string | null } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [releaseFilter, setReleaseFilter] = useState<'all' | 'upcoming'>('all');
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const utils = trpcReact.useUtils();

  // Debounced title for search
  const debouncedTitle = useDebounce(titleValue, 500);

  const searchQuery = trpcReact.book.searchExternal.useQuery(
    {
      title: debouncedTitle,
      ...(releaseFilter === 'upcoming' ? { availability: '4' } : {}),
    },
    { enabled: debouncedTitle.length >= 3 && showSuggestions },
  );

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showSuggestions]);

  const handleSelectSuggestion = useCallback(
    (item: { title: string; author: string; isbn: string; imageUrl: string | null }) => {
      setValue('title', item.title);
      setValue('author', item.author);
      if (item.isbn) setValue('isbn', item.isbn);
      if (item.imageUrl) setValue('imageUrl', item.imageUrl);
      setShowSuggestions(false);
    },
    [setValue],
  );

  const handleIsbnLookup = async () => {
    const trimmed = isbn?.trim().replace(/[-\s]/g, '');
    if (!trimmed || trimmed.length < 10) return;
    setLookupLoading(true);
    setIsbnPreview(null);
    try {
      const result = await utils.book.lookupIsbn.fetch({ isbn: trimmed });
      if (result) {
        if (result.title) setValue('title', result.title);
        if (result.author) setValue('author', result.author);
        if (result.coverUrl) setValue('imageUrl', result.coverUrl);
        setIsbnPreview(result);
      }
    } catch {
      // ISBNルックアップ失敗は無視
    } finally {
      setLookupLoading(false);
    }
  };

  const hasSuggestions = searchQuery.data && searchQuery.data.length > 0;

  const handleFormClear = () => {
    reset({
      title: '',
      author: '',
      isbn: '',
      status: 'UNREAD',
      imageUrl: '',
      notes: '',
      rating: null,
    });
    setIsbnPreview(null);
    setShowSuggestions(false);
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
              <div className="relative flex-1">
                <Input
                  id="isbn"
                  {...register('isbn')}
                  placeholder="978-..."
                  className="pr-7"
                />
                {isbn && (
                  <button
                    type="button"
                    onClick={() => { setValue('isbn', ''); setIsbnPreview(null); setValue('imageUrl', ''); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="ISBNをクリア"
                  >
                    <XIcon className="size-4" />
                  </button>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleIsbnLookup} disabled={lookupLoading} aria-label="ISBNで検索">
                {lookupLoading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SearchIcon className="size-4 mr-1" />
                )}
                {lookupLoading ? '検索中...' : '検索'}
              </Button>
            </div>
            {/* ISBN lookup preview */}
            {isbnPreview && (
              <div className="mt-2 flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
                {isbnPreview.coverUrl && (
                  <Image
                    src={isbnPreview.coverUrl}
                    alt={isbnPreview.title}
                    width={48}
                    height={64}
                    className="rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{isbnPreview.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{isbnPreview.author}</p>
                  <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">自動入力しました</p>
                </div>
              </div>
            )}
          </div>

          {/* Title + search suggestions */}
          <div className="relative space-y-1" ref={suggestionsRef}>
            <Label htmlFor="title">タイトル *</Label>
            <div className="relative">
              <Input
                id="title"
                {...register('title')}
                placeholder="本のタイトル（3文字以上で候補表示）"
                aria-invalid={!!errors.title}
                className="pr-7"
                onFocus={() => { if (debouncedTitle.length >= 3) setShowSuggestions(true); }}
                onChange={(e) => {
                  register('title').onChange(e);
                  if (e.target.value.length >= 3) setShowSuggestions(true);
                  else setShowSuggestions(false);
                }}
              />
              {titleValue && (
                <button
                  type="button"
                  onClick={() => { setValue('title', ''); setShowSuggestions(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="タイトルをクリア"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}

            {/* Suggestions dropdown */}
            {showSuggestions && debouncedTitle.length >= 3 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
                {/* Release schedule filter tabs */}
                <div className="flex border-b border-border">
                  <button
                    type="button"
                    onClick={() => setReleaseFilter('all')}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                      releaseFilter === 'all'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    全て
                  </button>
                  <button
                    type="button"
                    onClick={() => setReleaseFilter('upcoming')}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                      releaseFilter === 'upcoming'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    発売予定
                  </button>
                </div>
                {searchQuery.isLoading ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-16 w-11 shrink-0 rounded" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasSuggestions ? (
                  <div className="max-h-64 overflow-y-auto">
                    {(releaseFilter === 'upcoming'
                      ? searchQuery.data.filter((item) => {
                          if (!item.salesDate) return false;
                          const today = new Date(new Date().setHours(0, 0, 0, 0));
                          // "2026年05月15日頃" or "2026年05月15日"
                          const fullMatch = item.salesDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
                          if (fullMatch) {
                            const d = new Date(Number(fullMatch[1]), Number(fullMatch[2]) - 1, Number(fullMatch[3]));
                            return d >= today;
                          }
                          // "2024年05月" (no day)
                          const monthMatch = item.salesDate.match(/(\d{4})年(\d{1,2})月/);
                          if (monthMatch) {
                            // Use last day of that month
                            const d = new Date(Number(monthMatch[1]), Number(monthMatch[2]), 0);
                            return d >= today;
                          }
                          // "2024年" (year only)
                          const yearMatch = item.salesDate.match(/(\d{4})年/);
                          if (yearMatch) {
                            const d = new Date(Number(yearMatch[1]), 11, 31);
                            return d >= today;
                          }
                          return false; // Can't parse → exclude
                        })
                      : searchQuery.data
                    ).map((item, i) => (
                      <button
                        key={`${item.isbn}-${i}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="flex w-full gap-3 border-b border-border p-3 text-left transition-colors last:border-b-0 hover:bg-accent"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            width={44}
                            height={64}
                            className="shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                            No img
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.author}</p>
                          {item.publisher && (
                            <p className="truncate text-[10px] text-muted-foreground">{item.publisher}</p>
                          )}
                          {item.salesDate && (
                            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              <CalendarIcon className="size-2.5" />
                              {item.salesDate}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Author */}
          <div className="space-y-1">
            <Label htmlFor="author">著者 *</Label>
            <div className="relative">
              <Input id="author" {...register('author')} placeholder="著者名" aria-invalid={!!errors.author} className="pr-7" />
              {authorValue && (
                <button
                  type="button"
                  onClick={() => setValue('author', '')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="著者をクリア"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
            {errors.author && <p className="text-xs text-destructive">{errors.author.message}</p>}
          </div>

          {/* Cover preview */}
          {imageUrl && (
            <div className="space-y-1">
              <Label>書影プレビュー</Label>
              <Image
                src={imageUrl}
                alt="書影"
                width={96}
                height={128}
                className="rounded-md object-cover"
              />
            </div>
          )}

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
            <div className="relative">
              <Textarea id="notes" {...register('notes')} placeholder="感想やメモ..." rows={4} className="pr-7" />
              {notesValue && (
                <button
                  type="button"
                  onClick={() => setValue('notes', '')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  aria-label="メモをクリア"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleFormClear}>
              フォームをクリア
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? '保存中...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
