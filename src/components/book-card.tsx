'use client';

import Link from 'next/link';
import { BookCover } from '@/components/book-cover';
import { BookStatusBadge } from '@/components/book-status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { MoreVerticalIcon, PencilIcon, TrashIcon, BookOpenIcon, BookCheckIcon, BookMarkedIcon } from 'lucide-react';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    status: string;
    imageUrl?: string | null;
    rating?: number | null;
    createdAt: string | Date;
  };
  onStatusChange?: (id: string, status: 'UNREAD' | 'READING' | 'FINISHED') => void;
  onDelete?: (id: string) => void;
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

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function BookCard({ book, onStatusChange, onDelete }: BookCardProps) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardContent className="flex gap-4 py-3">
        <Link href={`/books/${book.id}`} className="shrink-0">
          <BookCover title={book.title} imageUrl={book.imageUrl} width={96} height={128} />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <Link href={`/books/${book.id}`} className="block">
              <h3 className="truncate text-sm font-semibold leading-snug hover:underline">
                {book.title}
              </h3>
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{book.author}</p>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <BookStatusBadge status={book.status} />
            <StarRating rating={book.rating} />
          </div>

          <p className="mt-1 text-xs text-muted-foreground">{formatDate(book.createdAt)}</p>
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
              <DropdownMenuItem render={<Link href={`/books/${book.id}/edit`} />}>
                <PencilIcon className="size-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>ステータス変更</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onStatusChange?.(book.id, 'UNREAD')}>
                <BookMarkedIcon className="size-4" />
                積読
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange?.(book.id, 'READING')}>
                <BookOpenIcon className="size-4" />
                読書中
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange?.(book.id, 'FINISHED')}>
                <BookCheckIcon className="size-4" />
                読了
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(book.id)}>
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
