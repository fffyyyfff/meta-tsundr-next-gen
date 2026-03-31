import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing usage-tracker
vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiUsage: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      aggregate: vi.fn().mockResolvedValue({
        _count: 0,
        _sum: { inputTokens: 0, outputTokens: 0, responseTimeMs: 0 },
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Import after mock
const { usageTracker } = await import('@/server/services/usage-tracker');
const { prisma } = await import('@/lib/prisma');

function makeRecord(overrides: Partial<{
  agentType: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
}> = {}) {
  return {
    timestamp: new Date(),
    agentType: overrides.agentType ?? 'design',
    inputTokens: overrides.inputTokens ?? 1000,
    outputTokens: overrides.outputTokens ?? 500,
    responseTimeMs: overrides.responseTimeMs ?? 200,
  };
}

describe('UsageTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the buffer by flushing (mock will succeed)
    return usageTracker.flush();
  });

  it('should track a usage record', () => {
    usageTracker.track(makeRecord());
    // getCurrentCost reads from buffer
    expect(usageTracker.getCurrentCost()).toBeGreaterThan(0);
  });

  it('should calculate current cost from buffer', () => {
    usageTracker.track(makeRecord({ inputTokens: 1_000_000, outputTokens: 0 }));
    // 1M input tokens at $3/1M = $3
    expect(usageTracker.getCurrentCost()).toBeCloseTo(3.0, 2);
  });

  it('should calculate cost for output tokens', () => {
    usageTracker.track(makeRecord({ inputTokens: 0, outputTokens: 1_000_000 }));
    // 1M output tokens at $15/1M = $15
    expect(usageTracker.getCurrentCost()).toBeCloseTo(15.0, 2);
  });

  it('should flush records to prisma', async () => {
    usageTracker.track(makeRecord());
    usageTracker.track(makeRecord());
    await usageTracker.flush();

    expect(prisma.apiUsage.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ agentType: 'design', inputTokens: 1000 }),
      ]),
    });
  });

  it('should not flush when buffer is empty', async () => {
    await usageTracker.flush();
    expect(prisma.apiUsage.createMany).not.toHaveBeenCalled();
  });

  it('should restore records to buffer on flush failure', async () => {
    vi.mocked(prisma.apiUsage.createMany).mockRejectedValueOnce(new Error('db down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    usageTracker.track(makeRecord({ inputTokens: 5000 }));
    await usageTracker.flush();

    // Buffer should still have records since flush failed
    expect(usageTracker.getCurrentCost()).toBeGreaterThan(0);
    consoleSpy.mockRestore();
  });

  it('should get usage summary combining db and buffer', async () => {
    vi.mocked(prisma.apiUsage.aggregate).mockResolvedValueOnce({
      _count: 5,
      _sum: { inputTokens: 10000, outputTokens: 5000, responseTimeMs: 1000 },
    } as never);

    usageTracker.track(makeRecord({ inputTokens: 2000, outputTokens: 1000, responseTimeMs: 300 }));

    const summary = await usageTracker.getUsageSummary('day');
    expect(summary.period).toBe('day');
    expect(summary.totalCalls).toBe(6); // 5 db + 1 buffer
    expect(summary.totalInputTokens).toBe(12000); // 10000 + 2000
    expect(summary.totalOutputTokens).toBe(6000); // 5000 + 1000
  });

  it('should get usage history', async () => {
    vi.mocked(prisma.apiUsage.findMany).mockResolvedValueOnce([]);

    const history = await usageTracker.getUsageHistory('week');
    expect(Array.isArray(history)).toBe(true);
  });
});
