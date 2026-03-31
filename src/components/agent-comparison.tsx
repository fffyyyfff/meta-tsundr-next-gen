'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ComparisonExecution {
  id: string;
  agentType: string;
  task: string;
  result: string | null;
  status: string;
  duration: number | null;
  tokenUsage?: number | null;
  createdAt: string;
}

const AGENT_LABELS: Record<string, string> = {
  design: 'Design',
  'code-review': 'CodeReview',
  'test-gen': 'TestGen',
  'task-mgmt': 'TaskMgmt',
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = Math.round(seconds % 60);
  return `${minutes}m ${remainingSec}s`;
}

/**
 * Compute line-level diff between two strings.
 * Returns arrays of lines with diff markers.
 */
function computeLineDiff(
  a: string,
  b: string,
): { left: DiffLine[]; right: DiffLine[] } {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const maxLen = Math.max(linesA.length, linesB.length);

  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  for (let i = 0; i < maxLen; i++) {
    const lineA = i < linesA.length ? linesA[i] : undefined;
    const lineB = i < linesB.length ? linesB[i] : undefined;

    if (lineA === lineB) {
      left.push({ text: lineA ?? '', type: 'same' });
      right.push({ text: lineB ?? '', type: 'same' });
    } else {
      left.push({ text: lineA ?? '', type: lineA === undefined ? 'empty' : 'removed' });
      right.push({ text: lineB ?? '', type: lineB === undefined ? 'empty' : 'added' });
    }
  }

  return { left, right };
}

interface DiffLine {
  text: string;
  type: 'same' | 'added' | 'removed' | 'empty';
}

const DIFF_COLORS: Record<DiffLine['type'], string> = {
  same: '',
  added: 'bg-emerald-100 dark:bg-emerald-900/30',
  removed: 'bg-red-100 dark:bg-red-900/30',
  empty: 'bg-gray-100 dark:bg-gray-800/30 opacity-40',
};

function MetricRow({
  label,
  leftValue,
  rightValue,
  betterSide,
}: {
  label: string;
  leftValue: string;
  rightValue: string;
  betterSide: 'left' | 'right' | 'equal';
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-sm">
      <span
        className={`text-right ${betterSide === 'left' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}
      >
        {leftValue}
      </span>
      <span className="text-xs text-muted-foreground px-2">{label}</span>
      <span
        className={`${betterSide === 'right' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}
      >
        {rightValue}
      </span>
    </div>
  );
}

interface AgentComparisonProps {
  left: ComparisonExecution | null;
  right: ComparisonExecution | null;
  onClear?: () => void;
}

export function AgentComparison({ left, right, onClear }: AgentComparisonProps) {
  const diff = useMemo(() => {
    if (!left?.result || !right?.result) return null;
    return computeLineDiff(left.result, right.result);
  }, [left?.result, right?.result]);

  if (!left && !right) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Select two execution results to compare. Use the compare button (⇔) on any result.
        </CardContent>
      </Card>
    );
  }

  const durationBetter =
    left?.duration != null && right?.duration != null
      ? left.duration < right.duration
        ? 'left' as const
        : left.duration > right.duration
          ? 'right' as const
          : 'equal' as const
      : 'equal' as const;

  const tokenBetter =
    left?.tokenUsage != null && right?.tokenUsage != null
      ? left.tokenUsage < right.tokenUsage
        ? 'left' as const
        : left.tokenUsage > right.tokenUsage
          ? 'right' as const
          : 'equal' as const
      : 'equal' as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Comparison</h3>
        {onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {/* Headers */}
      <div className="grid grid-cols-2 gap-4">
        {[left, right].map((exec, i) => (
          <Card key={exec?.id ?? `empty-${i}`}>
            <CardHeader className="pb-2">
              {exec ? (
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {AGENT_LABELS[exec.agentType] ?? exec.agentType}
                  </CardTitle>
                  <Badge
                    variant={
                      exec.status === 'completed'
                        ? 'success'
                        : exec.status === 'error'
                          ? 'error'
                          : 'default'
                    }
                  >
                    {exec.status}
                  </Badge>
                </div>
              ) : (
                <CardTitle className="text-sm text-muted-foreground">
                  Select a result to compare
                </CardTitle>
              )}
            </CardHeader>
            {exec && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">{exec.task}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Metrics comparison */}
      {left && right && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <MetricRow
              label="Duration"
              leftValue={formatDuration(left.duration)}
              rightValue={formatDuration(right.duration)}
              betterSide={durationBetter}
            />
            <MetricRow
              label="Tokens"
              leftValue={left.tokenUsage != null ? left.tokenUsage.toLocaleString() : '-'}
              rightValue={right.tokenUsage != null ? right.tokenUsage.toLocaleString() : '-'}
              betterSide={tokenBetter}
            />
            <MetricRow
              label="Status"
              leftValue={left.status}
              rightValue={right.status}
              betterSide="equal"
            />
          </CardContent>
        </Card>
      )}

      {/* Diff view */}
      {diff && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Result Diff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-0 overflow-auto rounded-md border border-border">
              {/* Left */}
              <div className="border-r border-border">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b border-border">
                  {AGENT_LABELS[left!.agentType] ?? left!.agentType}
                </div>
                <div className="text-xs leading-relaxed font-mono">
                  {diff.left.map((line, i) => (
                    <div
                      key={i}
                      className={`px-3 py-0.5 ${DIFF_COLORS[line.type]}`}
                    >
                      {line.text || '\u00A0'}
                    </div>
                  ))}
                </div>
              </div>
              {/* Right */}
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b border-border">
                  {AGENT_LABELS[right!.agentType] ?? right!.agentType}
                </div>
                <div className="text-xs leading-relaxed font-mono">
                  {diff.right.map((line, i) => (
                    <div
                      key={i}
                      className={`px-3 py-0.5 ${DIFF_COLORS[line.type]}`}
                    >
                      {line.text || '\u00A0'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
