import { prisma } from '../../lib/prisma';

export interface UsageRecord {
  timestamp: Date;
  agentType: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
}

export interface UsageSummary {
  period: 'day' | 'week' | 'month';
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgResponseTimeMs: number;
  estimatedCostUsd: number;
}

export interface UsageHistoryEntry {
  date: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  avgResponseTimeMs: number;
}

// Claude Sonnet pricing per 1M tokens
const PRICING = {
  input: 3.0,
  output: 15.0,
} as const;

const FLUSH_INTERVAL_MS = 60_000;
const FLUSH_BATCH_SIZE = 50;

class UsageTracker {
  private buffer: UsageRecord[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startPeriodicFlush();
  }

  track(record: UsageRecord): void {
    this.buffer.push(record);
    if (this.buffer.length >= FLUSH_BATCH_SIZE) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const records = this.buffer.splice(0);
    try {
      await prisma.apiUsage.createMany({
        data: records.map((r) => ({
          agentType: r.agentType,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          responseTimeMs: r.responseTimeMs,
          createdAt: r.timestamp,
        })),
      });
    } catch (error) {
      // Put records back on failure so they aren't lost
      this.buffer.unshift(...records);
      console.error('[usage-tracker] Failed to flush:', error);
    }
  }

  async getUsageSummary(period: 'day' | 'week' | 'month'): Promise<UsageSummary> {
    const since = this.periodStart(period);

    // Combine persisted + in-memory records
    const dbResult = await prisma.apiUsage.aggregate({
      where: { createdAt: { gte: since } },
      _count: true,
      _sum: { inputTokens: true, outputTokens: true, responseTimeMs: true },
    });

    const buffered = this.buffer.filter((r) => r.timestamp >= since);

    const totalCalls = (dbResult._count ?? 0) + buffered.length;
    const totalInputTokens =
      (dbResult._sum.inputTokens ?? 0) +
      buffered.reduce((s, r) => s + r.inputTokens, 0);
    const totalOutputTokens =
      (dbResult._sum.outputTokens ?? 0) +
      buffered.reduce((s, r) => s + r.outputTokens, 0);
    const totalResponseTime =
      (dbResult._sum.responseTimeMs ?? 0) +
      buffered.reduce((s, r) => s + r.responseTimeMs, 0);

    const avgResponseTimeMs = totalCalls > 0 ? Math.round(totalResponseTime / totalCalls) : 0;
    const estimatedCostUsd =
      (totalInputTokens / 1_000_000) * PRICING.input +
      (totalOutputTokens / 1_000_000) * PRICING.output;

    return {
      period,
      totalCalls,
      totalInputTokens,
      totalOutputTokens,
      avgResponseTimeMs,
      estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
    };
  }

  async getUsageHistory(period: 'day' | 'week' | 'month'): Promise<UsageHistoryEntry[]> {
    const since = this.periodStart(period);

    const rows = await prisma.apiUsage.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date string
    const grouped = new Map<string, { calls: number; input: number; output: number; respTime: number }>();

    for (const row of rows) {
      const date = row.createdAt.toISOString().slice(0, 10);
      const entry = grouped.get(date) ?? { calls: 0, input: 0, output: 0, respTime: 0 };
      entry.calls += 1;
      entry.input += row.inputTokens;
      entry.output += row.outputTokens;
      entry.respTime += row.responseTimeMs;
      grouped.set(date, entry);
    }

    // Include buffered records
    for (const rec of this.buffer) {
      if (rec.timestamp < since) continue;
      const date = rec.timestamp.toISOString().slice(0, 10);
      const entry = grouped.get(date) ?? { calls: 0, input: 0, output: 0, respTime: 0 };
      entry.calls += 1;
      entry.input += rec.inputTokens;
      entry.output += rec.outputTokens;
      entry.respTime += rec.responseTimeMs;
      grouped.set(date, entry);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        calls: v.calls,
        inputTokens: v.input,
        outputTokens: v.output,
        avgResponseTimeMs: v.calls > 0 ? Math.round(v.respTime / v.calls) : 0,
      }));
  }

  getCurrentCost(): number {
    const buffered = this.buffer.reduce(
      (acc, r) => ({
        input: acc.input + r.inputTokens,
        output: acc.output + r.outputTokens,
      }),
      { input: 0, output: 0 },
    );

    return (
      (buffered.input / 1_000_000) * PRICING.input +
      (buffered.output / 1_000_000) * PRICING.output
    );
  }

  private periodStart(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  private startPeriodicFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);
    // Don't keep the process alive just for flushing
    if (typeof this.flushTimer === 'object' && 'unref' in this.flushTimer) {
      this.flushTimer.unref();
    }
  }
}

export const usageTracker = new UsageTracker();
