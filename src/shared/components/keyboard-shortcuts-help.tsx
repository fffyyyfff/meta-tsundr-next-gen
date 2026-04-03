'use client';

import { useState, useCallback } from 'react';
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut';
import { Button } from '@/shared/ui/button';

const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], description: 'Execute task' },
  { keys: ['Ctrl', 'K'], description: 'Focus search / task input' },
  { keys: ['Escape'], description: 'Close modal / cancel' },
  { keys: ['?'], description: 'Show this help' },
] as const;

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  const toggleOpen = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  useKeyboardShortcut('?', toggleOpen);
  useKeyboardShortcut('Escape', close, { enabled: open, allowInInput: true });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <Button variant="ghost" size="sm" onClick={close} aria-label="Close shortcuts help">
            &times;
          </Button>
        </div>

        <ul className="space-y-3" role="list">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.description}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-foreground">{shortcut.description}</span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={key} className="flex items-center gap-1">
                    {i > 0 && <span className="text-xs text-muted-foreground">+</span>}
                    <Kbd>{key}</Kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Press <Kbd>?</Kbd> to toggle &middot; <Kbd>Esc</Kbd> to close
        </p>
      </div>
    </div>
  );
}
