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
import { CategoryIcon } from '@/components/category-icon';
import { XIcon } from 'lucide-react';

const ITEM_CATEGORIES = [
  { value: 'BOOK', label: '書籍' },
  { value: 'ELECTRONICS', label: '家電' },
  { value: 'DAILY_GOODS', label: '日用品' },
  { value: 'FOOD', label: '食品' },
  { value: 'CLOTHING', label: '衣類' },
  { value: 'HOBBY', label: '趣味' },
  { value: 'OTHER', label: 'その他' },
] as const;

const ITEM_STATUSES = [
  { value: 'WISHLIST', label: '欲しい' },
  { value: 'PURCHASED', label: '購入済み' },
  { value: 'IN_USE', label: '使用中' },
  { value: 'COMPLETED', label: '完了' },
  { value: 'RETURNED', label: '返品' },
] as const;

const SOURCES = [
  { value: '', label: '選択なし' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'rakuten', label: '楽天' },
  { value: 'store', label: '店舗' },
] as const;

const itemFormSchema = z.object({
  category: z.enum(['BOOK', 'ELECTRONICS', 'DAILY_GOODS', 'FOOD', 'CLOTHING', 'HOBBY', 'OTHER']),
  title: z.string().min(1, 'タイトルは必須です'),
  creator: z.string().optional(),
  externalId: z.string().optional(),
  price: z.number().min(0).nullable(),
  status: z.enum(['WISHLIST', 'PURCHASED', 'IN_USE', 'COMPLETED', 'RETURNED']),
  source: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).nullable(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

const CREATOR_LABELS: Record<string, string> = {
  BOOK: '著者',
  ELECTRONICS: 'メーカー',
  CLOTHING: 'ブランド',
  OTHER: 'メーカー',
};

function getCreatorLabel(category: string): string {
  return CREATOR_LABELS[category] ?? 'メーカー';
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

function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      aria-label={label}
    >
      <XIcon className="size-4" />
    </button>
  );
}

interface ItemFormProps {
  defaultValues?: Partial<ItemFormValues>;
  onSubmit: (data: ItemFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ItemForm({ defaultValues, onSubmit, isSubmitting, submitLabel = '保存' }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      category: 'OTHER',
      title: '',
      creator: '',
      externalId: '',
      price: null,
      status: 'PURCHASED',
      source: '',
      imageUrl: '',
      notes: '',
      rating: null,
      ...defaultValues,
    },
  });

  const categoryValue = watch('category');
  const titleValue = watch('title');
  const creatorValue = watch('creator');
  const notesValue = watch('notes');
  const imageUrl = watch('imageUrl');
  const priceValue = watch('price');
  const externalIdValue = watch('externalId');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedTitle = useDebounce(titleValue, 500);

  const searchQuery = trpcReact.item.searchProduct.useQuery(
    { keyword: debouncedTitle },
    { enabled: debouncedTitle.length >= 3 && showSuggestions },
  );

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
    (item: { title: string; creator?: string | null; imageUrl?: string | null; price?: number | null; externalId?: string | null; source?: string | null }) => {
      setValue('title', item.title);
      if (item.creator) setValue('creator', item.creator);
      if (item.imageUrl) setValue('imageUrl', item.imageUrl);
      if (item.price != null) setValue('price', item.price);
      if (item.externalId) setValue('externalId', item.externalId);
      if (item.source) setValue('source', item.source);
      setShowSuggestions(false);
    },
    [setValue],
  );

  const handleFormClear = () => {
    reset({
      category: 'OTHER',
      title: '',
      creator: '',
      externalId: '',
      price: null,
      status: 'PURCHASED',
      source: '',
      imageUrl: '',
      notes: '',
      rating: null,
    });
    setShowSuggestions(false);
  };

  const hasSuggestions = searchQuery.data && searchQuery.data.length > 0;
  const creatorLabel = getCreatorLabel(categoryValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultValues?.title ? 'アイテムを編集' : '新しいアイテムを追加'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="category">カテゴリ *</Label>
            <select
              id="category"
              {...register('category')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Title + search suggestions */}
          <div className="relative space-y-1" ref={suggestionsRef}>
            <Label htmlFor="title">タイトル *</Label>
            <div className="relative">
              <Input
                id="title"
                {...register('title')}
                placeholder="商品名（3文字以上で候補表示）"
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
                <ClearButton onClick={() => { setValue('title', ''); setShowSuggestions(false); }} label="タイトルをクリア" />
              )}
            </div>
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}

            {/* Suggestions dropdown */}
            {showSuggestions && debouncedTitle.length >= 3 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
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
                    {searchQuery.data.map((item, i) => (
                      <button
                        key={`${item.title}-${i}`}
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
                          {item.price != null && (
                            <p className="text-xs text-muted-foreground">{`\u00A5${item.price.toLocaleString()}`}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Creator */}
          <div className="space-y-1">
            <Label htmlFor="creator">
              <span className="flex items-center gap-1.5">
                <CategoryIcon category={categoryValue} className="size-3.5" />
                {creatorLabel}
              </span>
            </Label>
            <div className="relative">
              <Input id="creator" {...register('creator')} placeholder={`${creatorLabel}名`} className="pr-7" />
              {creatorValue && (
                <ClearButton onClick={() => setValue('creator', '')} label={`${creatorLabel}をクリア`} />
              )}
            </div>
          </div>

          {/* External ID */}
          <div className="space-y-1">
            <Label htmlFor="externalId">商品コード</Label>
            <div className="relative">
              <Input id="externalId" {...register('externalId')} placeholder="ASIN, JAN等" className="pr-7" />
              {externalIdValue && (
                <ClearButton onClick={() => setValue('externalId', '')} label="商品コードをクリア" />
              )}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <Label htmlFor="price">価格（円）</Label>
            <div className="relative">
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    placeholder="0"
                    className="pr-7"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? null : Number(val));
                    }}
                  />
                )}
              />
              {priceValue != null && (
                <ClearButton onClick={() => setValue('price', null)} label="価格をクリア" />
              )}
            </div>
          </div>

          {/* Cover preview */}
          {imageUrl && (
            <div className="space-y-1">
              <Label>画像プレビュー</Label>
              <Image
                src={imageUrl}
                alt="商品画像"
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
              {ITEM_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div className="space-y-1">
            <Label htmlFor="source">購入元</Label>
            <select
              id="source"
              {...register('source')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SOURCES.map((opt) => (
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
