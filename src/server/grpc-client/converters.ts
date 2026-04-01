import {
  type Book as ProtoBook,
  BookStatus as ProtoBookStatus,
  type Timestamp,
} from '@/generated/proto/tsundoku/book/v1/types';

export type AppBookStatus = 'WISHLIST' | 'UNREAD' | 'READING' | 'FINISHED';

export interface AppBook {
  id: string;
  userId: string;
  title: string;
  author: string;
  isbn: string | null;
  status: AppBookStatus;
  imageUrl: string | null;
  notes: string | null;
  rating: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Convert a proto Book message to the app-layer Book format.
 * Handles nil/undefined fields safely (gRPC may send partial messages).
 */
export function protoBookToAppBook(proto: Partial<ProtoBook>): AppBook {
  return {
    id: proto.id ?? '',
    userId: proto.userId ?? '',
    title: proto.title ?? '',
    author: proto.author ?? '',
    isbn: proto.isbn || null,
    status: protoStatusToAppStatus(proto.status),
    imageUrl: proto.imageUrl || null,
    notes: proto.notes || null,
    rating: proto.rating != null && proto.rating > 0 ? proto.rating : null,
    startedAt: timestampToDate(proto.startedAt),
    finishedAt: timestampToDate(proto.finishedAt),
    createdAt: timestampToDate(proto.createdAt) ?? new Date(),
    updatedAt: timestampToDate(proto.updatedAt) ?? new Date(),
    deletedAt: timestampToDate(proto.deletedAt),
  };
}

/**
 * Convert app-layer status string to proto BookStatus enum value.
 */
export function appStatusToProtoStatus(status: AppBookStatus): ProtoBookStatus {
  const map: Record<AppBookStatus, ProtoBookStatus> = {
    WISHLIST: ProtoBookStatus.UNSPECIFIED,
    UNREAD: ProtoBookStatus.UNREAD,
    READING: ProtoBookStatus.READING,
    FINISHED: ProtoBookStatus.FINISHED,
  };
  return map[status] ?? ProtoBookStatus.UNSPECIFIED;
}

/**
 * Convert proto BookStatus enum value to app-layer status string.
 * Exported for testing.
 */
export function protoStatusToAppStatus(value: ProtoBookStatus | undefined): AppBookStatus {
  if (value === undefined || value === null) return 'UNREAD';
  const map: Record<number, AppBookStatus> = {
    [ProtoBookStatus.UNREAD]: 'UNREAD',
    [ProtoBookStatus.READING]: 'READING',
    [ProtoBookStatus.FINISHED]: 'FINISHED',
  };
  return map[value] ?? 'UNREAD';
}

/**
 * Convert proto Timestamp to Date.
 * Handles undefined, null, and malformed timestamps safely.
 */
export function timestampToDate(ts: Timestamp | undefined | null): Date | null {
  if (!ts) return null;
  if (ts.seconds === undefined || ts.seconds === null) return null;
  const ms = Number(ts.seconds) * 1000 + (ts.nanos ?? 0) / 1_000_000;
  const date = new Date(ms);
  return isNaN(date.getTime()) ? null : date;
}
