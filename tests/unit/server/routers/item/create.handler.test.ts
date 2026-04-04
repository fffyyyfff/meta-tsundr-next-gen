import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpsert = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
    item: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock('@/server/services/cached-queries', () => ({
  invalidateCache: vi.fn(),
}));

import { createHandler } from '@/server/routers/item/create.handler';

describe('createHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ id: 'dev-user', email: 'dev-user@localhost' });
  });

  it('creates item with required fields', async () => {
    const createdItem = {
      id: 'item-1',
      category: 'BOOK',
      title: 'Test Item',
      userId: 'user-1',
    };
    mockCreate.mockResolvedValue(createdItem);

    const result = await createHandler({
      input: { category: 'BOOK', title: 'Test Item' },
      ctx: { userId: 'user-1' },
    });

    expect(result).toEqual(createdItem);
    expect(mockCreate).toHaveBeenCalledOnce();
    const createArgs = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createArgs.data.category).toBe('BOOK');
    expect(createArgs.data.title).toBe('Test Item');
    expect(createArgs.data.userId).toBe('user-1');
  });

  it('creates item with all optional fields', async () => {
    const input = {
      category: 'ELECTRONICS' as const,
      title: 'Keyboard',
      creator: 'HHKB',
      externalId: 'ext-123',
      status: 'PURCHASED' as const,
      imageUrl: 'https://example.com/img.jpg',
      price: 35000,
      purchaseDate: new Date('2025-01-15'),
      source: 'amazon',
      productUrl: 'https://example.com/product',
      notes: 'Great keyboard',
      rating: 5,
      metadata: { color: 'white' },
    };

    const createdItem = { id: 'item-2', ...input, userId: 'user-1' };
    mockCreate.mockResolvedValue(createdItem);

    const result = await createHandler({
      input,
      ctx: { userId: 'user-1' },
    });

    expect(result).toEqual(createdItem);
    const createArgs = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createArgs.data.creator).toBe('HHKB');
    expect(createArgs.data.price).toBe(35000);
    expect(createArgs.data.source).toBe('amazon');
    expect(createArgs.data.rating).toBe(5);
    expect(createArgs.data.metadata).toEqual({ color: 'white' });
  });

  it('upserts dev-user when userId is null', async () => {
    mockCreate.mockResolvedValue({ id: 'item-3', userId: 'dev-user' });

    await createHandler({
      input: { category: 'OTHER', title: 'Something' },
      ctx: { userId: null },
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { id: 'dev-user' },
      update: {},
      create: { id: 'dev-user', email: 'dev-user@localhost' },
    });

    const createArgs = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createArgs.data.userId).toBe('dev-user');
  });
});
