'use client';

import { Badge } from '@/components/ui/badge';

type BookStatus = 'UNREAD' | 'READING' | 'FINISHED';

const STATUS_CONFIG: Record<BookStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'outline' }> = {
  UNREAD: { label: '積読', variant: 'outline' },
  READING: { label: '読書中', variant: 'warning' },
  FINISHED: { label: '読了', variant: 'success' },
};

export function BookStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as BookStatus] ?? STATUS_CONFIG.UNREAD;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
