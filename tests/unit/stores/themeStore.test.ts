import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '@/stores/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    // Reset store state
    useThemeStore.setState({ theme: 'system' });
  });

  it('should default to system theme', () => {
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('should set theme to dark and persist to localStorage', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should set theme to light and persist to localStorage', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should add dark class to document when setting dark theme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should remove dark class from document when setting light theme', () => {
    document.documentElement.classList.add('dark');
    useThemeStore.getState().setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should resolve theme correctly', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().resolvedTheme()).toBe('dark');

    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().resolvedTheme()).toBe('light');
  });

  it('should resolve system theme to light when matchMedia returns false', () => {
    useThemeStore.getState().setTheme('system');
    // matchMedia mock returns matches: false (light)
    expect(useThemeStore.getState().resolvedTheme()).toBe('light');
  });
});
