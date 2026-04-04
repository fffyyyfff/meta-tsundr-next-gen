'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { CopyIcon, CheckIcon, DownloadIcon } from 'lucide-react';

interface ShareCardProps {
  bookId: string;
  bookTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareCard({ bookId, bookTitle, open, onOpenChange }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const ogUrl = `${origin}/api/og/book?id=${bookId}`;
  const bookUrl = `${origin}/books/${bookId}`;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(bookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bookUrl]);

  const handleTwitterShare = useCallback(() => {
    const text = encodeURIComponent(`「${bookTitle}」を読みました 📖`);
    const url = encodeURIComponent(bookUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
    );
  }, [bookTitle, bookUrl]);

  const handleDownload = useCallback(async () => {
    const res = await fetch(ogUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${bookTitle}.png`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }, [ogUrl, bookTitle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>共有</DialogTitle>
        </DialogHeader>

        {/* OGP Preview */}
        <div className="overflow-hidden rounded-lg border">
          <img src={ogUrl} alt="共有カード" className="w-full" loading="lazy" />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            {copied ? (
              <CheckIcon className="mr-1 size-4" />
            ) : (
              <CopyIcon className="mr-1 size-4" />
            )}
            {copied ? 'コピーしました' : 'URLをコピー'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleTwitterShare}
          >
            Xで共有
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <DownloadIcon className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
