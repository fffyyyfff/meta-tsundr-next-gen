'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CategoryIcon, getCategoryLabel } from '@/features/purchases/components/category-icon';
import { ItemStatusBadge } from '@/features/purchases/components/item-status-badge';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/shared/ui/dropdown-menu';
import {
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  ShoppingCartIcon,
  PlayIcon,
  CheckCircleIcon,
  Undo2Icon,
  ExternalLinkIcon,
} from 'lucide-react';

type ItemStatus = 'WISHLIST' | 'PURCHASED' | 'IN_USE' | 'COMPLETED' | 'RETURNED';

interface ItemCardProps {
  item: {
    id: string;
    category: string;
    title: string;
    creator?: string | null;
    status: string;
    imageUrl?: string | null;
    price?: number | null;
    source?: string | null;
    rating?: number | null;
    createdAt: string | Date;
  };
  onStatusChange?: (id: string, status: ItemStatus) => void;
  onDelete?: (id: string) => void;
}

function formatPrice(price: number | null | undefined): string | null {
  if (price == null) return null;
  return `\u00A5${price.toLocaleString()}`;
}

function SourceBadge({ source }: { source: string | null | undefined }) {
  if (!source) return null;
  const label = source === 'amazon' ? 'Amazon' : source === 'rakuten' ? '楽天' : source;
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
      {label}
    </Badge>
  );
}

function StarRating({ rating }: { rating: number | null | undefined }) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating}つ星`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-xs ${i < rating ? 'text-yellow-500' : 'text-muted-foreground/30'}`}>
          ★
        </span>
      ))}
    </span>
  );
}

const STATUS_ACTIONS: Array<{ status: ItemStatus; label: string; icon: typeof HeartIcon }> = [
  { status: 'WISHLIST', label: '欲しい', icon: HeartIcon },
  { status: 'PURCHASED', label: '購入済み', icon: ShoppingCartIcon },
  { status: 'IN_USE', label: '使用中', icon: PlayIcon },
  { status: 'COMPLETED', label: '完了', icon: CheckCircleIcon },
  { status: 'RETURNED', label: '返品', icon: Undo2Icon },
];

export function ItemCard({ item, onStatusChange, onDelete }: ItemCardProps) {
  const priceStr = formatPrice(item.price);

  return (
    <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex gap-4 py-3">
        <Link href={`/purchases/${item.id}`} className="shrink-0">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={64}
              height={96}
              className="rounded-md object-cover"
              style={{ width: 64, height: 96 }}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-md bg-muted"
              style={{ width: 64, height: 96 }}
            >
              <CategoryIcon category={item.category} className="size-6 text-muted-foreground" />
            </div>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <CategoryIcon category={item.category} className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{getCategoryLabel(item.category)}</span>
            </div>
            <Link href={`/purchases/${item.id}`} className="block">
              <h3 className="truncate text-sm font-semibold leading-snug hover:underline">
                {item.title}
              </h3>
            </Link>
            {item.creator && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.creator}</p>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ItemStatusBadge status={item.status} />
            <SourceBadge source={item.source} />
            <StarRating rating={item.rating} />
          </div>

          {priceStr && (
            <p className="mt-1 text-sm font-medium">{priceStr}</p>
          )}
        </div>

        {/* Dropdown menu */}
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-md p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100"
              aria-label="操作メニュー"
            >
              <MoreVerticalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/purchases/${item.id}`} />}>
                <ExternalLinkIcon className="size-4" />
                詳細を見る
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={`/purchases/${item.id}/edit`} />}>
                <PencilIcon className="size-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>ステータス変更</DropdownMenuLabel>
                {STATUS_ACTIONS.map((action) => (
                  <DropdownMenuItem
                    key={action.status}
                    onClick={() => onStatusChange?.(item.id, action.status)}
                  >
                    <action.icon className="size-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(item.id)}>
                <TrashIcon className="size-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
