'use client';

import { useState, useCallback } from 'react';
import { useFavoritesStore, type FavoriteExecution } from '@/features/dashboard/stores/favoritesStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

const AGENT_LABELS: Record<string, string> = {
  design: 'Design',
  'code-review': 'CodeReview',
  'test-gen': 'TestGen',
  'task-mgmt': 'TaskMgmt',
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = Math.round(seconds % 60);
  return `${minutes}m ${remainingSec}s`;
}

interface FavoritesListProps {
  onCompare?: (execution: FavoriteExecution) => void;
}

export function FavoritesList({ onCompare }: FavoritesListProps) {
  const { favorites, remove } = useFavoritesStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No favorites yet. Star an execution result to save it here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Favorites ({favorites.length})</h3>
      </div>

      <div className="space-y-2">
        {favorites.map((fav) => {
          const isExpanded = expandedId === fav.id;
          return (
            <Card key={fav.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-left"
                    onClick={() => toggleExpand(fav.id)}
                    aria-expanded={isExpanded}
                    aria-label={`Toggle details for ${fav.task}`}
                  >
                    <span className="text-sm" aria-hidden="true">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <CardTitle className="text-sm">{fav.task}</CardTitle>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant={fav.status === 'completed' ? 'success' : fav.status === 'error' ? 'error' : 'default'}>
                      {AGENT_LABELS[fav.agentType] ?? fav.agentType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(fav.duration)}
                    </span>
                    {onCompare && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCompare(fav)}
                        aria-label={`Compare ${fav.task}`}
                        title="Add to comparison"
                      >
                        ⇔
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(fav.id)}
                      aria-label={`Remove ${fav.task} from favorites`}
                      title="Remove from favorites"
                    >
                      ★
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && fav.result && (
                <CardContent className="pt-0">
                  <div className="rounded-md bg-muted/50 p-3">
                    <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                      {fav.result}
                    </pre>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>Duration: {formatDuration(fav.duration)}</span>
                    {fav.tokenUsage != null && <span>Tokens: {fav.tokenUsage.toLocaleString()}</span>}
                    <span>{new Date(fav.createdAt).toLocaleString('ja-JP')}</span>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
