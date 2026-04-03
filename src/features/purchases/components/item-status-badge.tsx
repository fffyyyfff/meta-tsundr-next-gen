'use client';

import { Badge } from '@/shared/ui/badge';

type ItemStatus = 'WISHLIST' | 'PURCHASED' | 'IN_USE' | 'COMPLETED' | 'RETURNED';

const STATUS_CONFIG: Record<ItemStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'outline' }> = {
  WISHLIST: { label: '欲しい', variant: 'default' },
  PURCHASED: { label: '購入済み', variant: 'outline' },
  IN_USE: { label: '使用中', variant: 'warning' },
  COMPLETED: { label: '完了', variant: 'success' },
  RETURNED: { label: '返品', variant: 'error' },
};

export function ItemStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as ItemStatus] ?? STATUS_CONFIG.PURCHASED;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
