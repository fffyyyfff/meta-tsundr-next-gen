"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { ReceiptScanner } from "@/features/purchases/components/receipt-scanner";
import { ArrowLeftIcon } from "lucide-react";

export default function ReceiptScanPage() {
  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Button variant="ghost" size="sm" render={<Link href="/purchases" />}>
        <ArrowLeftIcon className="mr-1 size-4" />
        購入一覧に戻る
      </Button>

      <PageHeader
        title="レシート読み取り"
        description="レシートを撮影またはアップロードして、購入アイテムを自動登録"
      />

      <ReceiptScanner />
    </div>
  );
}
