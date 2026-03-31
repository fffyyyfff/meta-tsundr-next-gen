import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut, useKeyboardShortcuts } from '@/hooks/useKeyboardShortcut';

function fireKey(
  key: string,
  opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean; target?: EventTarget } = {},
) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    altKey: opts.altKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  if (opts.target) {
    Object.defineProperty(event, 'target', { value: opts.target });
  }
  document.dispatchEvent(event);
}

describe('useKeyboardShortcut', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should call handler on matching key press', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('k', handler));
    fireKey('k');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should be case insensitive', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('k', handler));
    fireKey('K');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should not call handler for non-matching key', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('k', handler));
    fireKey('j');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should require ctrl modifier when specified', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('k', handler, { ctrl: true }));
    fireKey('k');
    expect(handler).not.toHaveBeenCalled();
    fireKey('k', { ctrlKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should require shift modifier when specified', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('k', handler, { shift: true }));
    fireKey('k');
    expect(handler).not.toHaveBeenCalled();
    fireKey('k', { shiftKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should not fire inside input elements by default', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('k', handler));
    const input = document.createElement('input');
    fireKey('k', { target: input });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should fire inside input elements when allowInInput is true', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('k', handler, { allowInInput: true }));
    const input = document.createElement('input');
    fireKey('k', { target: input });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should not fire when disabled', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut('k', handler, { enabled: false }));
    fireKey('k');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('k', handler));
    unmount();
    fireKey('k');
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('useKeyboardShortcuts', () => {
  it('should handle multiple shortcuts', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { key: 'a', handler: handler1 },
        { key: 'b', handler: handler2 },
      ]),
    );
    fireKey('a');
    fireKey('b');
    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should not fire when disabled', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'a', handler }], false),
    );
    fireKey('a');
    expect(handler).not.toHaveBeenCalled();
  });
});
