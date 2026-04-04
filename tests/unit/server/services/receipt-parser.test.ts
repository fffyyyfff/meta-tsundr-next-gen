import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ParsedReceipt } from '@/server/services/receipt-parser';

const mockMessagesCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockMessagesCreate };
  },
}));

import { parseReceipt, parseReceiptWithOcr } from '@/server/services/receipt-parser';

describe('parseReceipt', () => {
  let savedApiKey: string | undefined;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    savedApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-key';
    // Mock fetch to prevent real network calls (OCR service)
    vi.stubGlobal('fetch', mockFetch);
    // By default, OCR service returns failure so we fall through to Vision
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
  });

  afterEach(() => {
    if (savedApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = savedApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
    vi.unstubAllGlobals();
  });

  it('returns null when ANTHROPIC_API_KEY not set and OCR fails', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await parseReceipt('base64data', 'image/jpeg');

    expect(result).toBeNull();
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it('parses valid receipt response from Vision API', async () => {
    const receipt: ParsedReceipt = {
      storeName: 'セブンイレブン',
      items: [
        { title: 'おにぎり', price: 150, quantity: 2 },
        { title: 'お茶', price: 160, quantity: 1 },
      ],
      totalAmount: 460,
      purchaseDate: '2025-06-15',
      paymentMethod: '現金',
    };

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(receipt) }],
    });

    const result = await parseReceipt('base64data', 'image/jpeg');

    expect(result).toEqual(receipt);
    expect(result?.storeName).toBe('セブンイレブン');
    expect(result?.items).toHaveLength(2);
    expect(result?.totalAmount).toBe(460);
  });

  it('handles malformed JSON response from Vision API', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not valid JSON at all' }],
    });

    const result = await parseReceipt('base64data', 'image/jpeg');

    expect(result).toBeNull();
  });

  it('returns null when Vision content type is not text', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'x', name: 'tool', input: {} }],
    });

    const result = await parseReceipt('base64data', 'image/png');

    expect(result).toBeNull();
  });

  it('returns OCR result when OCR service succeeds', async () => {
    const ocrReceipt = {
      storeName: 'ローソン',
      items: [{ title: 'パン', price: 200, quantity: 1 }],
      totalAmount: 200,
      purchaseDate: '2025-07-01',
      error: null,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(ocrReceipt),
    });

    const result = await parseReceipt('base64data', 'image/jpeg');

    expect(result?.storeName).toBe('ローソン');
    // Vision API should NOT be called since OCR succeeded
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });
});

describe('parseReceiptWithOcr', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when OCR service returns error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await parseReceiptWithOcr('base64data', 'image/jpeg');

    expect(result).toBeNull();
  });

  it('returns null when OCR response has error field', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        storeName: null,
        items: [],
        totalAmount: 0,
        purchaseDate: null,
        error: 'Failed to parse',
      }),
    });

    const result = await parseReceiptWithOcr('base64data', 'image/png');

    expect(result).toBeNull();
  });

  it('returns parsed receipt when OCR succeeds', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        storeName: 'ファミリーマート',
        items: [{ title: 'おにぎり', price: 130, quantity: 1 }],
        totalAmount: 130,
        purchaseDate: '2025-08-01',
        error: null,
      }),
    });

    const result = await parseReceiptWithOcr('base64data', 'image/jpeg');

    expect(result).not.toBeNull();
    expect(result?.storeName).toBe('ファミリーマート');
    expect(result?.items).toHaveLength(1);
  });
});
