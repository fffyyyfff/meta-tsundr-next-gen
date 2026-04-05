"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { trpcReact } from "@/shared/lib/trpc-provider";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
  SearchIcon,
  Loader2Icon,
  CheckCircleIcon,
  BookOpenIcon,
} from "lucide-react";

interface SeriesVolume {
  number: number;
  title: string;
  isbn: string;
  imageUrl: string | null;
  salesDate: string;
}

interface SeriesInfo {
  seriesName: string;
  author: string;
  publisher: string;
  totalVolumes: number;
  volumes: SeriesVolume[];
}

type Step = "search" | "select" | "confirm";
type BookStatus = "WISHLIST" | "UNREAD" | "READING" | "FINISHED";

const STATUS_OPTIONS: Array<{ value: BookStatus; label: string }> = [
  { value: "UNREAD", label: "積読" },
  { value: "READING", label: "読書中" },
  { value: "FINISHED", label: "読了" },
];

interface SeriesBulkAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeriesBulkAdd({ open, onOpenChange }: SeriesBulkAddProps) {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<SeriesInfo | null>(
    null
  );
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
  const [rangeMin, setRangeMin] = useState(1);
  const [rangeMax, setRangeMax] = useState(1);
  const [status, setStatus] = useState<BookStatus>("UNREAD");
  const [result, setResult] = useState<{
    added: number;
    skipped: number;
  } | null>(null);

  const utils = trpcReact.useUtils();

  // Search query - only enabled when we have a search string and are on search step
  const [searchEnabled, setSearchEnabled] = useState(false);
  const searchResult = trpcReact.book.seriesSearch.useQuery(
    { title: searchQuery },
    { enabled: searchEnabled && searchQuery.length > 0 }
  );

  const bulkAddMutation = trpcReact.book.seriesBulkAdd.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.book.list.invalidate();
    },
  });

  const handleSearch = useCallback(() => {
    if (searchQuery.length > 0) {
      setSearchEnabled(true);
    }
  }, [searchQuery]);

  const handleSelectSeries = useCallback((series: SeriesInfo) => {
    setSelectedSeries(series);
    const minVol = Math.min(...series.volumes.map((v) => v.number));
    const maxVol = Math.max(...series.volumes.map((v) => v.number));
    setRangeMin(minVol);
    setRangeMax(maxVol);
    // Select all volumes by default
    setSelectedIndices(new Set(series.volumes.map((_, i) => i)));
    setStep("select");
  }, []);

  const handleRangeApply = useCallback(() => {
    if (!selectedSeries) return;
    const indices = new Set<number>();
    selectedSeries.volumes.forEach((vol, i) => {
      if (vol.number >= rangeMin && vol.number <= rangeMax) {
        indices.add(i);
      }
    });
    setSelectedIndices(indices);
  }, [selectedSeries, rangeMin, rangeMax]);

  const toggleVolume = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!selectedSeries) return;
    setSelectedIndices(new Set(selectedSeries.volumes.map((_, i) => i)));
  }, [selectedSeries]);

  const deselectAll = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const getSelectedVolumes = useCallback(() => {
    if (!selectedSeries) return [];
    return selectedSeries.volumes.filter((_, i) => selectedIndices.has(i));
  }, [selectedSeries, selectedIndices]);

  const handleConfirm = useCallback(() => {
    if (!selectedSeries) return;
    const volumes = getSelectedVolumes();
    bulkAddMutation.mutate({
      series: selectedSeries.seriesName,
      author: selectedSeries.author,
      volumes: volumes.map((v) => ({
        number: v.number,
        title: v.title,
        isbn: v.isbn,
        imageUrl: v.imageUrl,
      })),
      status,
    });
  }, [selectedSeries, getSelectedVolumes, status, bulkAddMutation]);

  const handleClose = useCallback(() => {
    setStep("search");
    setSearchQuery("");
    setSearchEnabled(false);
    setSelectedSeries(null);
    setSelectedIndices(new Set());
    setResult(null);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {step === "search" && "シリーズ検索"}
            {step === "select" &&
              `${selectedSeries?.seriesName ?? "シリーズ"} - 巻を選択`}
            {step === "confirm" && "登録完了"}
          </DialogTitle>
          <DialogDescription>
            {step === "search" &&
              "漫画タイトルを検索して、シリーズをまとめて登録"}
            {step === "select" &&
              `${selectedSeries?.author ?? ""} / ${selectedSeries?.totalVolumes ?? 0}巻`}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Search */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchEnabled(false);
                }}
                placeholder="漫画タイトルを入力..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searchResult.isFetching}>
                {searchResult.isFetching ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SearchIcon className="size-4" />
                )}
              </Button>
            </div>

            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {searchResult.data?.map((series, i) => (
                <button
                  key={`${series.seriesName}-${i}`}
                  onClick={() => handleSelectSeries(series)}
                  className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  {series.volumes[0]?.imageUrl ? (
                    <Image
                      src={series.volumes[0].imageUrl}
                      alt={series.seriesName}
                      width={48}
                      height={68}
                      className="shrink-0 rounded object-cover"
                      style={{ width: 48, height: 68 }}
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded bg-muted">
                      <BookOpenIcon className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{series.seriesName}</p>
                    <p className="text-sm text-muted-foreground">
                      {series.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {series.totalVolumes}巻
                    </p>
                  </div>
                </button>
              ))}

              {searchResult.isSuccess && searchResult.data?.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  シリーズが見つかりませんでした
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Volume selection */}
        {step === "select" && selectedSeries && !result && (
          <div className="space-y-4">
            {/* Range selector */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <Input
                type="number"
                min={1}
                value={rangeMin}
                onChange={(e) =>
                  setRangeMin(parseInt(e.target.value) || 1)
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">巻 から</span>
              <Input
                type="number"
                min={1}
                value={rangeMax}
                onChange={(e) =>
                  setRangeMax(parseInt(e.target.value) || 1)
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">巻 まで</span>
              <Button variant="outline" size="sm" onClick={handleRangeApply}>
                適用
              </Button>
            </div>

            {/* Select/Deselect buttons */}
            <div className="flex items-center gap-2 border-b pb-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                全選択
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                全解除
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                {selectedIndices.size}/{selectedSeries.volumes.length}巻選択
              </span>
            </div>

            {/* Volume list */}
            <div className="max-h-[35vh] space-y-1 overflow-y-auto pr-1">
              {selectedSeries.volumes.map((vol, index) => (
                <label
                  key={vol.isbn || `${vol.number}-${index}`}
                  className="flex cursor-pointer items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedIndices.has(index)}
                    onCheckedChange={() => toggleVolume(index)}
                  />
                  {vol.imageUrl ? (
                    <Image
                      src={vol.imageUrl}
                      alt={vol.title}
                      width={32}
                      height={45}
                      className="shrink-0 rounded object-cover"
                      style={{ width: 32, height: 45 }}
                      unoptimized
                    />
                  ) : (
                    <div
                      className="flex shrink-0 items-center justify-center rounded bg-muted"
                      style={{ width: 32, height: 45 }}
                    >
                      <span className="text-xs">{vol.number}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{vol.title}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Status selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                ステータス:
              </span>
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={status === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatus(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{selectedIndices.size}冊</span>
              <span className="text-muted-foreground"> を登録予定</span>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircleIcon className="size-12 text-emerald-500" />
            <p className="text-lg font-medium">
              {result.added}冊を登録しました
            </p>
            {result.skipped > 0 && (
              <p className="text-sm text-muted-foreground">
                {result.skipped}冊はすでに登録済みのためスキップ
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "select" && !result && (
            <>
              <Button variant="outline" onClick={() => setStep("search")}>
                戻る
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  selectedIndices.size === 0 || bulkAddMutation.isPending
                }
              >
                {bulkAddMutation.isPending ? (
                  <>
                    <Loader2Icon className="mr-1 size-4 animate-spin" />
                    登録中...
                  </>
                ) : (
                  `${selectedIndices.size}冊を登録する`
                )}
              </Button>
            </>
          )}
          {result && <Button onClick={handleClose}>閉じる</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
