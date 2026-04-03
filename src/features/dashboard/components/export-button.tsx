'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { trpcReact } from '@/shared/lib/trpc-provider';

type ExportFormat = 'json' | 'markdown' | 'csv';

const FORMAT_OPTIONS: { value: ExportFormat; label: string; ext: string; mime: string }[] = [
  { value: 'json', label: 'JSON', ext: 'json', mime: 'application/json' },
  { value: 'markdown', label: 'Markdown', ext: 'md', mime: 'text/markdown' },
  { value: 'csv', label: 'CSV', ext: 'csv', mime: 'text/csv' },
];

interface ExportButtonProps {
  userId: string;
  agentType?: 'design' | 'code-review' | 'test-gen' | 'task-mgmt';
  status?: 'completed' | 'error' | 'running' | 'pending';
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ userId, agentType, status }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const utils = trpcReact.useUtils();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setExporting(true);
      setOpen(false);

      const filterInput = {
        userId,
        ...(agentType && { agentType }),
        ...(status && { status }),
      };

      const timestamp = new Date().toISOString().slice(0, 10);

      try {
        switch (format) {
          case 'json': {
            const data = await utils.export.exportAsJson.fetch(filterInput);
            downloadBlob(JSON.stringify(data, null, 2), `executions-${timestamp}.json`, 'application/json');
            break;
          }
          case 'markdown': {
            const data = await utils.export.exportAsMarkdown.fetch(filterInput);
            downloadBlob(data.markdown, `executions-${timestamp}.md`, 'text/markdown');
            break;
          }
          case 'csv': {
            const data = await utils.export.exportAsCsv.fetch(filterInput);
            downloadBlob(data.csv, `executions-${timestamp}.csv`, 'text/csv');
            break;
          }
        }
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setExporting(false);
      }
    },
    [userId, agentType, status, utils],
  );

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={exporting}
      >
        <Download className="mr-1.5 h-4 w-4" />
        {exporting ? 'Exporting...' : 'Export'}
        <ChevronDown className="ml-1 h-3 w-3" />
      </Button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border border-border bg-popover py-1 shadow-md">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleExport(opt.value)}
              className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
