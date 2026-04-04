import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockMessagesCreate = vi.fn();

// Mock the receipt-parser module's dependency
vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    messages = { create: mockMessagesCreate };
  },
}));

// Import after mock is registered
import { parseReceipt } from '@/server/services/receipt-parser';

describe('parseReceipt', () => {
  let savedApiKey: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    savedApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (savedApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = savedApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('returns null when ANTHROPIC_API_KEY not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await parseReceipt('base64data', 'image/jpeg');
    expect(result).toBeNull();
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it('parses valid receipt response', async () => {
    const receipt = {
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
      content: [{ type: 'text' as const, text: JSON.stringify(receipt) }],
    });

    const result = await parseReceipt('base64data', 'image/jpeg');
    expect(result).toEqual(receipt);
    expect(result?.storeName).toBe('セブンイレブン');
    expect(result?.items).toHaveLength(2);
    expect(result?.totalAmount).toBe(460);
  });

  it('handles malformed JSON response', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text' as const, text: 'This is not valid JSON at all' }],
    });

    const result = await parseReceipt('base64data', 'image/jpeg');
    expect(result).toBeNull();
  });

  it('returns null when content type is not text', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'tool_use' as const, id: 'x', name: 'tool', input: {} }],
    });

    const result = await parseReceipt('base64data', 'image/png');
    expect(result).toBeNull();
  });
});
