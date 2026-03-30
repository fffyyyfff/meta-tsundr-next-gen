import { useEffect, useCallback, useRef } from 'react';

interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  /** When true, the shortcut fires even inside input/textarea/select elements */
  allowInInput?: boolean;
}

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

/**
 * Register one keyboard shortcut. Cleans up on unmount.
 */
export function useKeyboardShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    allowInInput?: boolean;
    enabled?: boolean;
  } = {},
): void {
  const { ctrl, meta, shift, alt, allowInInput, enabled = true } = options;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const listener = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (ctrl && !e.ctrlKey && !e.metaKey) return;
      if (meta && !e.metaKey) return;
      if (shift && !e.shiftKey) return;
      if (alt && !e.altKey) return;
      if (!allowInInput && isInputElement(e.target)) return;

      e.preventDefault();
      handlerRef.current(e);
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [key, ctrl, meta, shift, alt, allowInInput, enabled]);
}

/**
 * Register multiple keyboard shortcuts at once.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutDefinition[],
  enabled = true,
): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const listener = (e: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;
        if (shortcut.ctrl && !e.ctrlKey && !e.metaKey) continue;
        if (shortcut.meta && !e.metaKey) continue;
        if (shortcut.shift && !e.shiftKey) continue;
        if (shortcut.alt && !e.altKey) continue;
        if (!shortcut.allowInInput && isInputElement(e.target)) continue;

        e.preventDefault();
        shortcut.handler(e);
        return;
      }
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [enabled]);
}
