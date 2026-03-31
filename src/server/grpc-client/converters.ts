// TODO: Replace `any` types with generated proto types after running `npm run proto:gen`
// import { Book as ProtoBook, BookStatus as ProtoBookStatus } from '@/generated/proto/book_pb';

/**
 * Convert a proto Book message to the app-layer Book format.
 * Handles: Timestamp → Date, enum → string, optional fields.
 */
export function protoBookToAppBook(proto: Record<string, unknown>): {
  id: string;
  userId: string;
  title: string;
  author: string;
  isbn: string | null;
  status: 'UNREAD' | 'READING' | 'FINISHED';
  imageUrl: string | null;
  notes: string | null;
  rating: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
} {
  return {
    id: String(proto.id ?? ''),
    userId: String(proto.userId ?? ''),
    title: String(proto.title ?? ''),
    author: String(proto.author ?? ''),
    isbn: proto.isbn ? String(proto.isbn) : null,
    status: protoStatusToAppStatus(proto.status),
    imageUrl: proto.imageUrl ? String(proto.imageUrl) : null,
    notes: proto.notes ? String(proto.notes) : null,
    rating: typeof proto.rating === 'number' ? proto.rating : null,
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
export function appStatusToProtoStatus(status: 'UNREAD' | 'READING' | 'FINISHED'): number {
  // TODO: Use generated enum after proto:gen
  // Proto enum values: BOOK_STATUS_UNSPECIFIED=0, BOOK_STATUS_UNREAD=1, BOOK_STATUS_READING=2, BOOK_STATUS_FINISHED=3
  const map: Record<string, number> = {
    UNREAD: 1,
    READING: 2,
    FINISHED: 3,
  };
  return map[status] ?? 0;
}

/**
 * Convert proto BookStatus enum value to app-layer status string.
 */
function protoStatusToAppStatus(value: unknown): 'UNREAD' | 'READING' | 'FINISHED' {
  // TODO: Use generated enum after proto:gen
  const map: Record<number, 'UNREAD' | 'READING' | 'FINISHED'> = {
    1: 'UNREAD',
    2: 'READING',
    3: 'FINISHED',
  };
  if (typeof value === 'number') return map[value] ?? 'UNREAD';
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper === 'UNREAD' || upper === 'READING' || upper === 'FINISHED') {
      return upper;
    }
  }
  return 'UNREAD';
}

/**
 * Convert proto Timestamp (seconds + nanos) or ISO string to Date.
 */
function timestampToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'object' && value !== null) {
    const ts = value as { seconds?: bigint | number; nanos?: number };
    if (ts.seconds !== undefined) {
      const ms = Number(ts.seconds) * 1000 + (ts.nanos ?? 0) / 1_000_000;
      return new Date(ms);
    }
  }
  return null;
}
