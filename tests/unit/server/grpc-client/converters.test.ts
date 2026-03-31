import { describe, test, expect } from 'vitest';
import {
  protoBookToAppBook,
  appStatusToProtoStatus,
  protoStatusToAppStatus,
  timestampToDate,
} from '@/server/grpc-client/converters';
import { BookStatus } from '@/generated/proto/tsundoku/book/v1/types';

describe('protoBookToAppBook', () => {
  const fullProto = {
    id: 'book-1',
    userId: 'user-1',
    title: 'テスト本',
    author: '著者太郎',
    isbn: '9784000000001',
    status: BookStatus.READING,
    imageUrl: 'https://example.com/cover.jpg',
    notes: 'メモ',
    rating: 4,
    startedAt: { seconds: 1700000000n, nanos: 0 },
    finishedAt: undefined,
    createdAt: { seconds: 1690000000n, nanos: 0 },
    updatedAt: { seconds: 1700000000n, nanos: 500000000 },
    deletedAt: undefined,
  };

  test('converts a full proto Book to AppBook', () => {
    const result = protoBookToAppBook(fullProto);
    expect(result.id).toBe('book-1');
    expect(result.title).toBe('テスト本');
    expect(result.status).toBe('READING');
    expect(result.rating).toBe(4);
    expect(result.isbn).toBe('9784000000001');
    expect(result.startedAt).toBeInstanceOf(Date);
    expect(result.finishedAt).toBeNull();
    expect(result.deletedAt).toBeNull();
  });

  test('handles empty/partial proto (nil safety)', () => {
    const result = protoBookToAppBook({});
    expect(result.id).toBe('');
    expect(result.title).toBe('');
    expect(result.status).toBe('UNREAD');
    expect(result.rating).toBeNull();
    expect(result.isbn).toBeNull();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  test('rating 0 is treated as null (proto default)', () => {
    const result = protoBookToAppBook({ ...fullProto, rating: 0 });
    expect(result.rating).toBeNull();
  });

  test('empty string isbn is treated as null', () => {
    const result = protoBookToAppBook({ ...fullProto, isbn: '' });
    expect(result.isbn).toBeNull();
  });
});

describe('appStatusToProtoStatus', () => {
  test('maps UNREAD to proto enum', () => {
    expect(appStatusToProtoStatus('UNREAD')).toBe(BookStatus.UNREAD);
  });

  test('maps READING to proto enum', () => {
    expect(appStatusToProtoStatus('READING')).toBe(BookStatus.READING);
  });

  test('maps FINISHED to proto enum', () => {
    expect(appStatusToProtoStatus('FINISHED')).toBe(BookStatus.FINISHED);
  });
});

describe('protoStatusToAppStatus', () => {
  test('maps proto UNREAD to app status', () => {
    expect(protoStatusToAppStatus(BookStatus.UNREAD)).toBe('UNREAD');
  });

  test('maps proto READING to app status', () => {
    expect(protoStatusToAppStatus(BookStatus.READING)).toBe('READING');
  });

  test('maps proto FINISHED to app status', () => {
    expect(protoStatusToAppStatus(BookStatus.FINISHED)).toBe('FINISHED');
  });

  test('maps UNSPECIFIED to UNREAD (default)', () => {
    expect(protoStatusToAppStatus(BookStatus.UNSPECIFIED)).toBe('UNREAD');
  });

  test('maps undefined to UNREAD (nil safety)', () => {
    expect(protoStatusToAppStatus(undefined)).toBe('UNREAD');
  });
});

describe('timestampToDate', () => {
  test('converts valid timestamp to Date', () => {
    const date = timestampToDate({ seconds: 1700000000n, nanos: 0 });
    expect(date).toBeInstanceOf(Date);
    expect(date!.getTime()).toBe(1700000000000);
  });

  test('includes nanos in conversion', () => {
    const date = timestampToDate({ seconds: 1700000000n, nanos: 500000000 });
    expect(date!.getTime()).toBe(1700000000500);
  });

  test('returns null for undefined', () => {
    expect(timestampToDate(undefined)).toBeNull();
  });

  test('returns null for null', () => {
    expect(timestampToDate(null)).toBeNull();
  });
});
