'use client';

import { useState } from 'react';
import { trpcReact } from '@/lib/trpc-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SparklesIcon, BookOpenTextIcon, CalendarDaysIcon } from 'lucide-react';

function MarkdownBlock({ text }: { text: string }) {
  // Simple markdown rendering: ## headings, **bold**, - lists
  const lines = text.split('\n');
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-semibold mt-2 mb-1">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-sm ml-4 list-disc">{line.slice(2)}</li>;
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />;
        }
        // Bold
        const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return (
          <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      })}
    </div>
  );
}

// --- AiRecommendation ---

export function AiRecommendation() {
  const [result, setResult] = useState<string | null>(null);

  const mutation = trpcReact.book.getAiRecommendation.useMutation({
    onSuccess: (data) => setResult(data.recommendation ?? null),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <SparklesIcon className="size-4 text-yellow-500" />
            AIおすすめ
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '分析中...' : 'おすすめを取得'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mutation.error && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}
        {result ? (
          <div className="rounded-md bg-muted/50 p-4">
            <MarkdownBlock text={result} />
          </div>
        ) : !mutation.isPending && !mutation.error ? (
          <p className="text-sm text-muted-foreground">
            読書履歴に基づいて次に読む本をAIが提案します
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

// --- AiReview ---

interface AiReviewProps {
  bookId: string;
}

export function AiReview({ bookId }: AiReviewProps) {
  const [result, setResult] = useState<string | null>(null);

  const mutation = trpcReact.book.generateReview.useMutation({
    onSuccess: (data) => setResult(data.review ?? null),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpenTextIcon className="size-4 text-blue-500" />
            AI書評
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutation.mutate({ bookId })}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '生成中...' : '書評を生成'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mutation.error && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}
        {result ? (
          <div className="rounded-md bg-muted/50 p-4">
            <MarkdownBlock text={result} />
          </div>
        ) : !mutation.isPending && !mutation.error ? (
          <p className="text-sm text-muted-foreground">
            この書籍のAI書評を自動生成します
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

// --- AiReadingPlan ---

export function AiReadingPlan() {
  const [result, setResult] = useState<string | null>(null);

  const mutation = trpcReact.book.createReadingPlan.useMutation({
    onSuccess: (data) => setResult(data.plan ?? null),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDaysIcon className="size-4 text-emerald-500" />
            読書計画
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '作成中...' : '計画を作成'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mutation.error && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}
        {result ? (
          <div className="rounded-md bg-muted/50 p-4">
            <MarkdownBlock text={result} />
          </div>
        ) : !mutation.isPending && !mutation.error ? (
          <p className="text-sm text-muted-foreground">
            積読リストからAIが読書スケジュールを作成します
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
