import {
  type Book as ProtoBook,
  BookStatus as ProtoBookStatus,
  type Timestamp,
} from '@/generated/proto/tsundoku/book/v1/types';

export type AppBookStatus = 'UNREAD' | 'READING' | 'FINISHED';

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
 */
export function protoBookToAppBook(proto: ProtoBook): AppBook {
  return {
    id: proto.id,
    userId: proto.userId,
    title: proto.title,
    author: proto.author,
    isbn: proto.isbn || null,
    status: protoStatusToAppStatus(proto.status),
    imageUrl: proto.imageUrl || null,
    notes: proto.notes || null,
    rating: proto.rating || null,
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
    UNREAD: ProtoBookStatus.UNREAD,
    READING: ProtoBookStatus.READING,
    FINISHED: ProtoBookStatus.FINISHED,
  };
  return map[status] ?? ProtoBookStatus.UNSPECIFIED;
}

/**
 * Convert proto BookStatus enum value to app-layer status string.
 */
function protoStatusToAppStatus(value: ProtoBookStatus): AppBookStatus {
  const map: Record<number, AppBookStatus> = {
    [ProtoBookStatus.UNREAD]: 'UNREAD',
    [ProtoBookStatus.READING]: 'READING',
    [ProtoBookStatus.FINISHED]: 'FINISHED',
  };
  return map[value] ?? 'UNREAD';
}

/**
 * Convert proto Timestamp to Date.
 */
function timestampToDate(ts: Timestamp | undefined): Date | null {
  if (!ts) return null;
  const ms = Number(ts.seconds) * 1000 + ts.nanos / 1_000_000;
  return new Date(ms);
}
