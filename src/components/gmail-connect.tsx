'use client';

import { useState } from 'react';
import { trpcReact } from '@/lib/trpc-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2Icon, RefreshCwIcon, UnplugIcon, CheckCircleIcon } from 'lucide-react';
import { GmailIcon } from '@/components/gmail-icon';

export function GmailConnect() {
  const statusQuery = trpcReact.gmail.getStatus.useQuery(undefined, { retry: false });
  const utils = trpcReact.useUtils();
  const [syncResult, setSyncResult] = useState<{ newItems: number; errors: string[] } | null>(null);

  const syncMutation = trpcReact.gmail.sync.useMutation({
    onSuccess: (data) => {
      setSyncResult({ newItems: data.newItems, errors: data.errors });
      utils.gmail.getStatus.invalidate();
      utils.item.list.invalidate();
    },
  });

  const disconnectMutation = trpcReact.gmail.disconnect.useMutation({
    onSuccess: () => {
      setSyncResult(null);
      utils.gmail.getStatus.invalidate();
    },
  });

  if (statusQuery.isLoading) {
    return null;
  }

  const status = statusQuery.data;

  // Not connected
  if (!status?.connected) {
    return (
      <Button variant="outline" size="sm" render={<a href="/api/gmail/callback" />}>
        <GmailIcon className="size-4 mr-1" />
        Gmail連携
      </Button>
    );
  }

  // Connected
  return (
    <Card variant="glass" className="w-full">
      <CardContent className="flex flex-wrap items-center gap-3 py-2 px-3">
        <div className="flex items-center gap-2 text-sm">
          <GmailIcon className="size-4 text-[var(--page-accent)]" />
          <span className="text-muted-foreground">{status.email ?? 'Gmail連携済み'}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {syncMutation.isPending ? (
            <Button variant="outline" size="sm" disabled>
              <Loader2Icon className="size-4 mr-1 animate-spin" />
              取得中...
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSyncResult(null); syncMutation.mutate(); }}
            >
              <RefreshCwIcon className="size-4 mr-1" />
              同期
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
          >
            <UnplugIcon className="size-4 mr-1" />
            連携解除
          </Button>
        </div>

        {/* Sync result message */}
        {syncResult && (
          <div className="w-full">
            {syncResult.errors.length > 0 ? (
              <p className="text-xs text-destructive">{syncResult.errors[0]}</p>
            ) : (
              <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircleIcon className="size-3" />
                {syncResult.newItems}件の新規購入を取得
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
