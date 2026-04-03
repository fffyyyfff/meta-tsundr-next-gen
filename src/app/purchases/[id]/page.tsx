"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { trpcReact } from "@/shared/lib/trpc-provider";
import {
  CategoryIcon,
  getCategoryLabel,
} from "@/features/purchases/components/category-icon";
import { ItemStatusBadge } from "@/features/purchases/components/item-status-badge";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  ShoppingCartIcon,
  PlayIcon,
  CheckCircleIcon,
  Undo2Icon,
  ExternalLinkIcon,
  ChevronDownIcon,
  Loader2Icon,
} from "lucide-react";

type ItemStatus =
  | "WISHLIST"
  | "PURCHASED"
  | "IN_USE"
  | "COMPLETED"
  | "RETURNED";

const STATUS_ACTIONS: Array<{
  status: ItemStatus;
  label: string;
  icon: typeof HeartIcon;
}> = [
  { status: "WISHLIST", label: "欲しい", icon: HeartIcon },
  { status: "PURCHASED", label: "購入済み", icon: ShoppingCartIcon },
  { status: "IN_USE", label: "使用中", icon: PlayIcon },
  { status: "COMPLETED", label: "完了", icon: CheckCircleIcon },
  { status: "RETURNED", label: "返品", icon: Undo2Icon },
];

const SOURCE_STYLES: Record<string, string> = {
  amazon:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  rakuten: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function SourceBadge({ source }: { source: string | null | undefined }) {
  if (!source) return null;
  const label =
    source === "amazon"
      ? "Amazon"
      : source === "rakuten"
        ? "楽天"
        : source;
  const style = SOURCE_STYLES[source] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function StarDisplay({ rating }: { rating: number | null | undefined }) {
  if (!rating)
    return <span className="text-sm text-muted-foreground">未評価</span>;
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`${rating}つ星`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`text-lg ${i < rating ? "text-yellow-500" : "text-muted-foreground/30"}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "-";
  return `¥${price.toLocaleString()}`;
}

export default function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const itemQuery = trpcReact.item.getById.useQuery({ id });
  const utils = trpcReact.useUtils();

  const changeStatusMutation = trpcReact.item.changeStatus.useMutation({
    onSuccess: () => {
      utils.item.getById.invalidate({ id });
    },
  });

  const deleteMutation = trpcReact.item.delete.useMutation({
    onSuccess: () => {
      router.push("/purchases");
    },
  });

  const handleStatusChange = useCallback(
    (status: ItemStatus) => {
      changeStatusMutation.mutate({ id, status });
    },
    [id, changeStatusMutation]
  );

  const handleDelete = useCallback(() => {
    deleteMutation.mutate({ id });
    setDeleteDialogOpen(false);
  }, [id, deleteMutation]);

  if (itemQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-8">
          <Skeleton className="h-[280px] w-[200px] shrink-0 rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (itemQuery.error || !itemQuery.data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-muted-foreground">アイテムが見つかりません</p>
        <Button
          variant="outline"
          className="mt-4"
          render={<Link href="/purchases" />}
        >
          一覧に戻る
        </Button>
      </div>
    );
  }

  const item = itemQuery.data;
  const currentAction = STATUS_ACTIONS.find((a) => a.status === item.status);

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" render={<Link href="/purchases" />}>
        <ArrowLeftIcon className="mr-1 size-4" />
        購入一覧に戻る
      </Button>

      {/* Main card: image + meta */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-8 sm:flex-row">
            {/* Image */}
            <div className="flex shrink-0 justify-center sm:justify-start">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={200}
                  height={280}
                  className="rounded-lg object-cover shadow-md"
                  style={{ width: 200, height: 280 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-lg bg-muted shadow-md"
                  style={{ width: 200, height: 280 }}
                >
                  <CategoryIcon
                    category={item.category}
                    className="size-16 text-muted-foreground"
                  />
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-1 flex-col gap-4">
              {/* Category */}
              <div className="flex items-center gap-1.5">
                <CategoryIcon
                  category={item.category}
                  className="size-4 text-[var(--page-accent)]"
                />
                <span className="text-sm text-muted-foreground">
                  {getCategoryLabel(item.category)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold leading-tight">
                {item.title}
              </h1>

              {/* Creator/Brand */}
              {item.creator && (
                <p className="text-base text-muted-foreground">
                  {item.creator}
                </p>
              )}

              {/* Price */}
              <p className="text-xl font-bold text-[var(--page-accent)]">
                {formatPrice(item.price)}
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-3">
                <ItemStatusBadge status={item.status} />
                <SourceBadge source={item.source} />
              </div>

              {/* Rating */}
              <StarDisplay rating={item.rating} />

              {/* Status change dropdown */}
              <div className="pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-xs hover:bg-accent disabled:opacity-50"
                    disabled={changeStatusMutation.isPending}
                  >
                    {changeStatusMutation.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : currentAction ? (
                      <currentAction.icon className="size-4" />
                    ) : null}
                    ステータス変更
                    <ChevronDownIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>ステータスを選択</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STATUS_ACTIONS.map((action) => (
                      <DropdownMenuItem
                        key={action.status}
                        onClick={() => handleStatusChange(action.status)}
                        disabled={item.status === action.status}
                      >
                        <action.icon className="size-4" />
                        {action.label}
                        {item.status === action.status && (
                          <Badge
                            variant="outline"
                            className="ml-auto text-[10px]"
                          >
                            現在
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">詳細情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">購入日</p>
              <p className="font-medium">
                {formatDate(item.purchaseDate)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">追加日</p>
              <p className="font-medium">{formatDate(item.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">更新日</p>
              <p className="font-medium">{formatDate(item.updatedAt)}</p>
            </div>
            {item.externalId && (
              <div>
                <p className="text-muted-foreground">商品コード</p>
                <p className="font-medium font-mono text-xs">
                  {item.externalId}
                </p>
              </div>
            )}
          </div>

          {/* Product URL */}
          {item.productUrl && (
            <div className="mt-4">
              <p className="mb-1 text-sm text-muted-foreground">商品ページ</p>
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[var(--page-accent)] hover:underline"
              >
                {new URL(item.productUrl).hostname}
                <ExternalLinkIcon className="size-3" />
              </a>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="mt-4">
              <p className="mb-1 text-sm text-muted-foreground">メモ</p>
              <div className="rounded-md bg-muted/50 p-3">
                <pre className="whitespace-pre-wrap break-words text-sm">
                  {item.notes}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          render={<Link href={`/purchases/${item.id}/edit`} />}
        >
          <PencilIcon className="mr-1 size-4" />
          編集
        </Button>
        {item.productUrl && (
          <Button
            variant="outline"
            render={
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLinkIcon className="mr-1 size-4" />
            商品ページを開く
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={deleteMutation.isPending}
        >
          <TrashIcon className="mr-1 size-4" />
          削除
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>アイテムを削除</DialogTitle>
            <DialogDescription>
              「{item.title}」を削除しますか？この操作は取り消せます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-1 size-4 animate-spin" />
                  削除中...
                </>
              ) : (
                "削除する"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
