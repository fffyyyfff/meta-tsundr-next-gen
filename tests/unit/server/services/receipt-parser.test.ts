import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import { parseReceipt } from '@/server/services/receipt-parser';
import type { ParsedReceipt } from '@/server/services/receipt-parser';

describe('parseReceipt', () => {
  const originalEnv = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalEnv;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('returns null when ANTHROPIC_API_KEY not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await parseReceipt('base64data', 'image/jpeg');

    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('parses valid receipt response', async () => {
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

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(receipt) }],
    });

    const result = await parseReceipt('base64data', 'image/jpeg');

    expect(result).toEqual(receipt);
    expect(result?.storeName).toBe('セブンイレブン');
    expect(result?.items).toHaveLength(2);
    expect(result?.totalAmount).toBe(460);
  });

  it('handles malformed JSON response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not valid JSON at all' }],
    });

    const result = await parseReceipt('base64data', 'image/jpeg');

    expect(result).toBeNull();
  });

  it('returns null when content type is not text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'x', name: 'tool', input: {} }],
    });

    const result = await parseReceipt('base64data', 'image/png');

    expect(result).toBeNull();
  });
});
