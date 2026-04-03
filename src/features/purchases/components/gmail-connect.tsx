"use client";

import { useState, useCallback } from "react";
import { trpcReact } from "@/shared/lib/trpc-provider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Loader2Icon,
  RefreshCwIcon,
  UnplugIcon,
  CheckCircleIcon,
} from "lucide-react";
import { GmailIcon } from "@/features/purchases/components/gmail-icon";

type ItemCategory =
  | "BOOK"
  | "ELECTRONICS"
  | "DAILY_GOODS"
  | "FOOD"
  | "CLOTHING"
  | "HOBBY"
  | "OTHER";

interface PreviewItem {
  title: string;
  price: number;
  source: "amazon" | "rakuten";
  orderNumber: string;
  orderDate: string;
  category: ItemCategory;
  quantity: number;
  gmailMessageId: string;
}

export function GmailConnect() {
  const statusQuery = trpcReact.gmail.getStatus.useQuery(undefined, {
    retry: false,
  });
  const utils = trpcReact.useUtils();
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{
    saved: number;
  } | null>(null);

  const previewMutation = trpcReact.gmail.preview.useMutation({
    onSuccess: (data) => {
      if (data.errorMessage) return;
      if (data.items.length > 0) {
        setPreviewItems(data.items as PreviewItem[]);
        setSelectedIndices(
          new Set(data.items.map((_: unknown, i: number) => i))
        );
        setDialogOpen(true);
      }
    },
  });

  const confirmMutation = trpcReact.gmail.confirm.useMutation({
    onSuccess: (data) => {
      if (!data.error) {
        setConfirmResult({ saved: data.saved });
        setDialogOpen(false);
        setPreviewItems([]);
        utils.gmail.getStatus.invalidate();
        utils.item.list.invalidate();
      }
    },
  });

  const disconnectMutation = trpcReact.gmail.disconnect.useMutation({
    onSuccess: () => {
      setConfirmResult(null);
      utils.gmail.getStatus.invalidate();
    },
  });

  const toggleItem = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIndices(new Set(previewItems.map((_, i) => i)));
  }, [previewItems]);

  const deselectAll = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const handleConfirm = useCallback(() => {
    const selected = previewItems.filter((_, i) => selectedIndices.has(i));
    confirmMutation.mutate({ items: selected });
  }, [previewItems, selectedIndices, confirmMutation]);

  if (statusQuery.isLoading) {
    return null;
  }

  const status = statusQuery.data;

  if (!status?.connected) {
    return (
      <Button
        variant="outline"
        size="sm"
        render={<a href="/api/gmail/callback" />}
      >
        <GmailIcon className="mr-1 size-4" />
        Gmail連携
      </Button>
    );
  }

  const formatPrice = (price: number) =>
    `¥${price.toLocaleString("ja-JP")}`;

  return (
    <>
      <Card variant="glass" className="w-full">
        <CardContent className="flex flex-wrap items-center gap-3 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <GmailIcon className="size-4 text-[var(--page-accent)]" />
            <span className="text-muted-foreground">
              {status.email ?? "Gmail連携済み"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {previewMutation.isPending ? (
              <Button variant="outline" size="sm" disabled>
                <Loader2Icon className="mr-1 size-4 animate-spin" />
                取得中...
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmResult(null);
                  previewMutation.mutate();
                }}
              >
                <RefreshCwIcon className="mr-1 size-4" />
                同期
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              <UnplugIcon className="mr-1 size-4" />
              連携解除
            </Button>
          </div>

          {previewMutation.data?.errorMessage && (
            <div className="w-full">
              <p className="text-xs text-destructive">
                {previewMutation.data.errorMessage}
              </p>
            </div>
          )}

          {previewMutation.isSuccess &&
            previewMutation.data.items.length === 0 &&
            !previewMutation.data.errorMessage && (
              <div className="w-full">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  新しい購入メールは見つかりませんでした
                </p>
              </div>
            )}

          {confirmResult && (
            <div className="w-full">
              <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircleIcon className="size-3" />
                {confirmResult.saved}件の購入を登録しました
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {previewItems.length}件の購入が見つかりました
            </DialogTitle>
            <DialogDescription>
              登録するアイテムを選択してください
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b pb-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              全選択
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              全解除
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedIndices.size}/{previewItems.length} 件選択
            </span>
          </div>

          <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
            {previewItems.map((item, index) => (
              <label
                key={`${item.orderNumber}-${item.title}-${index}`}
                className="flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={selectedIndices.has(index)}
                  onCheckedChange={() => toggleItem(index)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--page-accent)]">
                      {formatPrice(item.price)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.source === "amazon"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {item.source === "amazon" ? "Amazon" : "楽天"}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={confirmMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                selectedIndices.size === 0 || confirmMutation.isPending
              }
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-1 size-4 animate-spin" />
                  登録中...
                </>
              ) : (
                `${selectedIndices.size}件を追加する`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
