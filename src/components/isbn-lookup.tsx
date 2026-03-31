'use client';

import { useState } from 'react';
import { SearchIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpcReact } from '@/lib/trpc-provider';

interface IsbnResult {
  title: string | null;
  author: string | null;
  coverUrl: string | null;
}

interface IsbnLookupProps {
  onSelect: (data: { title: string; author: string; imageUrl: string | null }) => void;
}

export function IsbnLookup({ onSelect }: IsbnLookupProps) {
  const [isbn, setIsbn] = useState('');
  const [result, setResult] = useState<IsbnResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookupQuery = trpcReact.book.lookupIsbn.useQuery(
    { isbn: isbn.replace(/[-\s]/g, '') },
    {
      enabled: false,
    },
  );

  const handleSearch = async () => {
    const cleaned = isbn.replace(/[-\s]/g, '');
    if (cleaned.length < 10) return;

    setNotFound(false);
    setResult(null);

    const res = await lookupQuery.refetch();
    if (res.data) {
      setResult(res.data);
    } else {
      setNotFound(true);
    }
  };

  const handleSelect = () => {
    if (!result?.title) return;
    onSelect({
      title: result.title,
      author: result.author ?? '',
      imageUrl: result.coverUrl ?? null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          placeholder="ISBN (10桁 or 13桁)"
          className="flex-1"
          aria-label="ISBN入力"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={lookupQuery.isFetching || isbn.replace(/[-\s]/g, '').length < 10}
        >
          {lookupQuery.isFetching ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SearchIcon className="size-4 mr-1" />
          )}
          検索
        </Button>
      </div>

      {notFound && (
        <p className="text-sm text-muted-foreground">書籍が見つかりませんでした</p>
      )}

      {result?.title && (
        <div className="flex gap-3 rounded-lg border border-border p-3">
          {result.coverUrl && (
            <img
              src={result.coverUrl}
              alt={result.title}
              className="h-20 w-14 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium">{result.title}</p>
            {result.author && (
              <p className="truncate text-xs text-muted-foreground">{result.author}</p>
            )}
            <Button type="button" size="sm" variant="outline" onClick={handleSelect}>
              この情報を使う
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
