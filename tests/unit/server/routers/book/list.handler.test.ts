import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
const mockFindMany = vi.fn();
vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    book: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

// Mock withCache to pass through
vi.mock('@/server/services/cached-queries', () => ({
  withCache: <T>(_key: string, _ttl: number, fn: () => Promise<T>) => fn(),
}));

// Mock gRPC client to always fail so we hit Prisma fallback
vi.mock('@/server/routers/grpc-client', () => ({
  bookClient: {
    getBooks: () => Promise.reject(new Error('gRPC unavailable')),
  },
}));

vi.mock('@/server/routers/grpc-client/converters', () => ({
  appStatusToProtoStatus: (s: string) => s,
}));

import { listHandler } from '@/server/routers/book/list.handler';

const defaultCtx = { userId: 'user-1', token: null };

function makeBook(overrides: Record<string, unknown> = {}) {
  return {
    id: 'book-1',
    title: 'Test Book',
    author: 'Author',
    status: 'UNREAD',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    userId: 'user-1',
    ...overrides,
  };
}

describe('listHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns books list with default pagination', async () => {
    const books = [makeBook({ id: 'b1' }), makeBook({ id: 'b2' })];
    mockFindMany.mockResolvedValue(books);

    const result = await listHandler({
      input: { sortBy: 'createdAt', sortOrder: 'desc', limit: 20 },
      ctx: defaultCtx,
    });

    expect(result.items).toEqual(books);
    expect(result.nextCursor).toBeUndefined();
    expect(mockFindMany).toHaveBeenCalledOnce();

    const callArgs = mockFindMany.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs).toMatchObject({
      where: { deletedAt: null, userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 21,
    });
  });

  it('filters by status', async () => {
    mockFindMany.mockResolvedValue([]);

    await listHandler({
      input: { status: 'READING' as const, sortBy: 'createdAt', sortOrder: 'desc', limit: 20 },
      ctx: defaultCtx,
    });

    const callArgs = mockFindMany.mock.calls[0][0] as Record<string, unknown>;
    const where = callArgs.where as Record<string, unknown>;
    expect(where.status).toBe('READING');
  });

  it('filters by search query', async () => {
    mockFindMany.mockResolvedValue([]);

    await listHandler({
      input: { search: 'TypeScript', sortBy: 'createdAt', sortOrder: 'desc', limit: 20 },
      ctx: defaultCtx,
    });

    const callArgs = mockFindMany.mock.calls[0][0] as Record<string, unknown>;
    const where = callArgs.where as Record<string, unknown>;
    expect(where.OR).toEqual([
      { title: { contains: 'TypeScript', mode: 'insensitive' } },
      { author: { contains: 'TypeScript', mode: 'insensitive' } },
    ]);
  });

  it('handles empty results', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await listHandler({
      input: { sortBy: 'createdAt', sortOrder: 'desc', limit: 20 },
      ctx: defaultCtx,
    });

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeUndefined();
  });

  it('returns nextCursor when there are more results', async () => {
    // Return limit + 1 items to trigger pagination
    const books = Array.from({ length: 3 }, (_, i) => makeBook({ id: `b${i}` }));
    mockFindMany.mockResolvedValue(books);

    const result = await listHandler({
      input: { sortBy: 'createdAt', sortOrder: 'desc', limit: 2 },
      ctx: defaultCtx,
    });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBe('b1');
  });
});
