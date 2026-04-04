"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { trpcReact } from "@/shared/lib/trpc-provider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import dynamic from "next/dynamic";

const LazyDialog = dynamic(
  () => import("@/shared/ui/dialog").then((m) => ({ default: m.Dialog })),
  { ssr: false },
);
const LazyDialogContent = dynamic(
  () => import("@/shared/ui/dialog").then((m) => ({ default: m.DialogContent })),
  { ssr: false },
);
const LazyDialogDescription = dynamic(
  () => import("@/shared/ui/dialog").then((m) => ({ default: m.DialogDescription })),
  { ssr: false },
);
const LazyDialogFooter = dynamic(
  () => import("@/shared/ui/dialog").then((m) => ({ default: m.DialogFooter })),
  { ssr: false },
);
const LazyDialogHeader = dynamic(
  () => import("@/shared/ui/dialog").then((m) => ({ default: m.DialogHeader })),
  { ssr: false },
);
const LazyDialogTitle = dynamic(
  () => import("@/shared/ui/dialog").then((m) => ({ default: m.DialogTitle })),
  { ssr: false },
);
import {
  CameraIcon,
  UploadIcon,
  Loader2Icon,
  CheckCircleIcon,
  XIcon,
  SparklesIcon,
  ScanLineIcon,
} from "lucide-react";

type ItemCategory =
  | "BOOK"
  | "ELECTRONICS"
  | "DAILY_GOODS"
  | "FOOD"
  | "CLOTHING"
  | "HOBBY"
  | "OTHER";

interface ScannedItem {
  title: string;
  price: number;
  quantity: number;
  category: string;
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    BOOK: "書籍",
    ELECTRONICS: "家電",
    DAILY_GOODS: "日用品",
    FOOD: "食品",
    CLOTHING: "衣類",
    HOBBY: "趣味",
    OTHER: "その他",
  };
  return labels[cat] ?? cat;
}

type ScanMode = "ai" | "ocr";

export function ReceiptScanner() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [isDragging, setIsDragging] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("ai");

  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveResult, setSaveResult] = useState<{ count: number } | null>(null);

  const utils = trpcReact.useUtils();

  const scanMutation = trpcReact.item.scanReceipt.useMutation({
    onSuccess: (data) => {
      if (data.error) return;
      if (data.items.length > 0) {
        setScannedItems(data.items);
        setStoreName(data.storeName);
        setPurchaseDate(data.purchaseDate);
        setSelectedIndices(new Set(data.items.map((_: ScannedItem, i: number) => i)));
        setDialogOpen(true);
      }
    },
  });

  const createMutation = trpcReact.item.create.useMutation();

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    setImageMimeType(file.type);
    setSaveResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Extract base64 portion
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScan = useCallback(() => {
    if (!imageBase64) return;
    scanMutation.mutate({
      image: imageBase64,
      mimeType: imageMimeType as "image/jpeg" | "image/png" | "image/webp",
      mode: scanMode,
    });
  }, [imageBase64, imageMimeType, scanMode, scanMutation]);

  const handleClear = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setSaveResult(null);
    setScannedItems([]);
  }, []);

  const toggleItem = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIndices(new Set(scannedItems.map((_, i) => i)));
  }, [scannedItems]);

  const deselectAll = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const handleConfirm = useCallback(async () => {
    const selected = scannedItems.filter((_, i) => selectedIndices.has(i));
    let count = 0;

    for (const item of selected) {
      await createMutation.mutateAsync({
        title: item.title,
        category: item.category as ItemCategory,
        price: item.price,
        status: "PURCHASED",
        source: storeName ?? undefined,
        purchaseDate: purchaseDate ?? undefined,
      });
      count++;
    }

    setSaveResult({ count });
    setDialogOpen(false);
    setScannedItems([]);
    setImagePreview(null);
    setImageBase64(null);
    utils.item.list.invalidate();
  }, [
    scannedItems,
    selectedIndices,
    storeName,
    purchaseDate,
    createMutation,
    utils,
  ]);

  const formatPrice = (price: number) => `¥${price.toLocaleString("ja-JP")}`;

  return (
    <div className="space-y-6">
      {/* Scan mode selector */}
      <div className="flex gap-2 rounded-lg bg-muted p-1">
        <button
          onClick={() => setScanMode("ai")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            scanMode === "ai"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <SparklesIcon className="size-4" />
          AI解析
        </button>
        <button
          onClick={() => setScanMode("ocr")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            scanMode === "ocr"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ScanLineIcon className="size-4" />
          OCR解析
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {scanMode === "ai"
          ? "Claude Vision で高精度解析（有料・3〜10秒）"
          : "PaddleOCR で高速解析（無料・要 Docker）"}
      </p>

      {/* Upload area */}
      {!imagePreview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? "border-[var(--page-accent)] bg-[var(--page-accent-muted)]"
              : "border-muted-foreground/30 hover:border-muted-foreground/50"
          }`}
        >
          <UploadIcon className="mb-4 size-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">
            レシート画像をドロップ
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            または下のボタンから選択
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="mr-1 size-4" />
              ファイルを選択
            </Button>
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
            >
              <CameraIcon className="mr-1 size-4" />
              カメラで撮影
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Image
                  src={imagePreview}
                  alt="レシートプレビュー"
                  width={300}
                  height={400}
                  className="max-h-[400px] w-auto rounded-lg object-contain shadow-md"
                  unoptimized
                />
                <button
                  onClick={handleClear}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-md hover:bg-destructive/80"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleScan}
                  disabled={scanMutation.isPending}
                >
                  {scanMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-1 size-4 animate-spin" />
                      解析中...
                    </>
                  ) : (
                    "解析する"
                  )}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  別の画像を選択
                </Button>
              </div>
            </div>

            {scanMutation.data?.error && (
              <div className="mt-4 text-center">
                <p className="text-sm text-destructive">
                  {scanMutation.data.error}
                </p>
                {scanMode === "ocr" && scanMutation.data.error.includes("OCR") && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    docker compose up ocr-service を実行してください
                  </p>
                )}
              </div>
            )}

            {scanMutation.isSuccess &&
              !scanMutation.data.error &&
              scanMutation.data.items.length === 0 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  商品情報を読み取れませんでした
                </p>
              )}
          </CardContent>
        </Card>
      )}

      {/* Save result */}
      {saveResult && (
        <p className="flex items-center justify-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircleIcon className="size-4" />
          {saveResult.count}件のアイテムを登録しました
        </p>
      )}

      {/* Results dialog */}
      <LazyDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <LazyDialogContent className="max-h-[80vh] max-w-lg overflow-hidden">
          <LazyDialogHeader>
            <LazyDialogTitle>
              {scannedItems.length}件の商品を検出
            </LazyDialogTitle>
            <LazyDialogDescription>
              {storeName && <span className="font-medium">{storeName}</span>}
              {storeName && purchaseDate && " ・ "}
              {purchaseDate && <span>{purchaseDate}</span>}
              {(storeName || purchaseDate) && <br />}
              登録するアイテムを選択してください
            </LazyDialogDescription>
          </LazyDialogHeader>

          <div className="flex items-center gap-2 border-b pb-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              全選択
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              全解除
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedIndices.size}/{scannedItems.length} 件選択
            </span>
          </div>

          <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
            {scannedItems.map((item, index) => (
              <label
                key={`${item.title}-${index}`}
                className="flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={selectedIndices.has(index)}
                  onCheckedChange={() => toggleItem(index)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--page-accent)]">
                      {formatPrice(item.price)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <LazyDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                selectedIndices.size === 0 || createMutation.isPending
              }
            >
              {createMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-1 size-4 animate-spin" />
                  登録中...
                </>
              ) : (
                `${selectedIndices.size}件を追加する`
              )}
            </Button>
          </LazyDialogFooter>
        </LazyDialogContent>
      </LazyDialog>
    </div>
  );
}
