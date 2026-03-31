import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  it('should return correct initial state', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50, itemsPerPage: 10 }),
    );
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(10);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 30, itemsPerPage: 10 }),
    );
    act(() => result.current.next());
    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPrev).toBe(true);
    expect(result.current.startIndex).toBe(10);
    expect(result.current.endIndex).toBe(20);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 30, itemsPerPage: 10, initialPage: 3 }),
    );
    act(() => result.current.prev());
    expect(result.current.currentPage).toBe(2);
  });

  it('should not go below page 1', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 30, itemsPerPage: 10 }),
    );
    act(() => result.current.prev());
    expect(result.current.currentPage).toBe(1);
  });

  it('should not go above total pages', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 30, itemsPerPage: 10, initialPage: 3 }),
    );
    act(() => result.current.next());
    expect(result.current.currentPage).toBe(3);
    expect(result.current.hasNext).toBe(false);
  });

  it('should go to specific page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50, itemsPerPage: 10 }),
    );
    act(() => result.current.goTo(3));
    expect(result.current.currentPage).toBe(3);
  });

  it('should clamp goTo to valid range', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50, itemsPerPage: 10 }),
    );
    act(() => result.current.goTo(100));
    expect(result.current.currentPage).toBe(5);

    act(() => result.current.goTo(-1));
    expect(result.current.currentPage).toBe(1);
  });

  it('should handle zero items', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 0, itemsPerPage: 10 }),
    );
    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasNext).toBe(false);
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(0);
  });

  it('should calculate endIndex correctly for last partial page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, itemsPerPage: 10, initialPage: 3 }),
    );
    expect(result.current.startIndex).toBe(20);
    expect(result.current.endIndex).toBe(25);
  });

  it('should use default itemsPerPage of 10', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 35 }),
    );
    expect(result.current.totalPages).toBe(4);
  });
});
