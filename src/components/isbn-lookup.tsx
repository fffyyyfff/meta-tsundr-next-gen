'use client';

import { useState, useCallback } from 'react';
import { SearchIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpcReact } from '@/lib/trpc-provider';

type SearchMode = 'isbn' | 'title';

interface BookCandidate {
  title: string;
  author: string;
  isbn?: string;
  imageUrl: string | null;
  publisher?: string;
  description?: string;
}

interface IsbnLookupProps {
  onSelect: (data: { title: string; author: string; imageUrl: string | null; isbn?: string }) => void;
}

export function IsbnLookup({ onSelect }: IsbnLookupProps) {
  const [mode, setMode] = useState<SearchMode>('isbn');
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<BookCandidate[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const utils = trpcReact.useUtils();

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (mode === 'isbn') {
      const cleaned = trimmed.replace(/[-\s]/g, '');
      if (cleaned.length < 10) return;

      setLoading(true);
      setNotFound(false);
      setCandidates([]);

      try {
        const res = await utils.book.lookupIsbn.fetch({ isbn: cleaned });
        if (res) {
          setCandidates([{
            title: res.title ?? '',
            author: res.author ?? '',
            imageUrl: res.coverUrl ?? null,
          }]);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      setNotFound(false);
      setCandidates([]);

      try {
        const res = await utils.book.searchExternal.fetch({ title: trimmed });
        if (res.length > 0) {
          setCandidates(res);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
  }, [mode, query, utils]);

  const handleSelect = useCallback((candidate: BookCandidate) => {
    onSelect({
      title: candidate.title,
      author: candidate.author,
      imageUrl: candidate.imageUrl,
      isbn: candidate.isbn,
    });
    setCandidates([]);
    setQuery('');
  }, [onSelect]);

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-md bg-muted p-0.5">
        {([['isbn', 'ISBN'], ['title', 'タイトル']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setMode(value); setCandidates([]); setNotFound(false); }}
            className={`flex-1 rounded px-3 py-1 text-xs font-medium transition-colors ${
              mode === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'isbn' ? 'ISBN (10桁 or 13桁)' : 'タイトルで検索...'}
          className="flex-1"
          aria-label={mode === 'isbn' ? 'ISBN入力' : 'タイトル検索'}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? (
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

      {/* Results */}
      {candidates.length > 0 && (
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
          {candidates.map((c, i) => (
            <button
              key={`${c.isbn ?? ''}-${i}`}
              type="button"
              onClick={() => handleSelect(c)}
              className="flex w-full gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
            >
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt={c.title}
                  className="h-16 w-11 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  No img
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.title}</p>
                <p className="truncate text-xs text-muted-foreground">{c.author}</p>
                {c.publisher && (
                  <p className="truncate text-xs text-muted-foreground">{c.publisher}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
