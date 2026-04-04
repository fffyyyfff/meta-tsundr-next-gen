import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchByKeyword } from '@/server/services/rakuten-ichiba';
import type { RakutenIchibaItem } from '@/server/services/rakuten-ichiba';

describe('searchByKeyword', () => {
  const originalEnv = process.env.RAKUTEN_APP_ID;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAKUTEN_APP_ID = 'test-app-id';
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.RAKUTEN_APP_ID = originalEnv;
    } else {
      delete process.env.RAKUTEN_APP_ID;
    }
    vi.unstubAllGlobals();
  });

  it('returns empty array when RAKUTEN_APP_ID not set', async () => {
    delete process.env.RAKUTEN_APP_ID;

    const result = await searchByKeyword('keyboard');

    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('maps API response correctly', async () => {
    const apiResponse = {
      Items: [
        {
          Item: {
            itemName: 'HHKB Professional',
            shopName: 'PFU Direct',
            itemCode: 'pfu-hhkb-001',
            mediumImageUrls: [{ imageUrl: 'https://example.com/img.jpg' }],
            smallImageUrls: [],
            itemPrice: 35000,
            itemUrl: 'https://item.rakuten.co.jp/pfu/hhkb',
            itemCaption: 'High quality keyboard for programmers',
          },
        },
        {
          Item: {
            itemName: 'Realforce',
            shopName: 'Topre Shop',
            itemCode: 'topre-rf-001',
            mediumImageUrls: [],
            smallImageUrls: [{ imageUrl: 'https://example.com/small.jpg' }],
            itemPrice: 30000,
            itemUrl: 'https://item.rakuten.co.jp/topre/rf',
            itemCaption: 'Premium keyboard',
          },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(apiResponse),
    });

    const result = await searchByKeyword('keyboard');

    expect(result).toHaveLength(2);

    const first: RakutenIchibaItem = result[0];
    expect(first.title).toBe('HHKB Professional');
    expect(first.creator).toBe('PFU Direct');
    expect(first.externalId).toBe('pfu-hhkb-001');
    expect(first.imageUrl).toBe('https://example.com/img.jpg');
    expect(first.price).toBe(35000);
    expect(first.productUrl).toBe('https://item.rakuten.co.jp/pfu/hhkb');

    // Second item falls back to smallImageUrls
    expect(result[1].imageUrl).toBe('https://example.com/small.jpg');
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await searchByKeyword('keyboard');

    expect(result).toEqual([]);
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await searchByKeyword('keyboard');

    expect(result).toEqual([]);
  });

  it('handles empty Items array', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Items: [] }),
    });

    const result = await searchByKeyword('nonexistent');

    expect(result).toEqual([]);
  });
});
