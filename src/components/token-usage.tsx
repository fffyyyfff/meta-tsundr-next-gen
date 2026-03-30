'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

// Claude Sonnet pricing per 1M tokens
const PRICING = {
  input: 3.0,
  output: 15.0,
} as const;

interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
}

interface TokenUsageProps {
  dailyUsage: DailyUsage[];
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function formatCost(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
}

export function TokenUsage({ dailyUsage }: TokenUsageProps) {
  const { maxTokens, totalInput, totalOutput, totalCost } = useMemo(() => {
    let tInput = 0;
    let tOutput = 0;
    let maxT = 0;

    for (const day of dailyUsage) {
      tInput += day.inputTokens;
      tOutput += day.outputTokens;
      const dayTotal = day.inputTokens + day.outputTokens;
      if (dayTotal > maxT) maxT = dayTotal;
    }

    const cost =
      (tInput / 1_000_000) * PRICING.input +
      (tOutput / 1_000_000) * PRICING.output;

    return { maxTokens: maxT || 1, totalInput: tInput, totalOutput: tOutput, totalCost: cost };
  }, [dailyUsage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage</CardTitle>
        <CardDescription>Daily consumption &amp; cost estimate (Claude Sonnet)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dailyUsage.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No usage data available
          </p>
        ) : (
          <>
            {/* Daily bar chart */}
            <div className="flex items-end gap-1" style={{ height: 120 }}>
              {dailyUsage.map((day) => {
                const total = day.inputTokens + day.outputTokens;
                const heightPct = (total / maxTokens) * 100;
                const inputPct =
                  total > 0 ? (day.inputTokens / total) * 100 : 0;

                return (
                  <div
                    key={day.date}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="relative w-full min-w-[8px] overflow-hidden rounded-t-sm"
                      style={{ height: `${heightPct}%` }}
                      title={`${formatDate(day.date)}: ${formatTokens(total)} tokens`}
                    >
                      <div
                        className="absolute bottom-0 w-full bg-blue-400 dark:bg-blue-500"
                        style={{ height: `${inputPct}%` }}
                      />
                      <div
                        className="absolute top-0 w-full bg-violet-400 dark:bg-violet-500"
                        style={{ height: `${100 - inputPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-none">
                      {formatDate(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm bg-blue-400 dark:bg-blue-500" />
                Input
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm bg-violet-400 dark:bg-violet-500" />
                Output
              </span>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Input</p>
                <p className="text-lg font-semibold">{formatTokens(totalInput)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Output</p>
                <p className="text-lg font-semibold">{formatTokens(totalOutput)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Cost</p>
                <p className="text-lg font-semibold">{formatCost(totalCost)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <span className="text-xs text-muted-foreground">
          Pricing: ${PRICING.input}/1M input, ${PRICING.output}/1M output
        </span>
      </CardFooter>
    </Card>
  );
}
