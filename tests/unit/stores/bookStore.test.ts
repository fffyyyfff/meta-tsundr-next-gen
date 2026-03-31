import { describe, it, expect, beforeEach } from 'vitest';
import { useBookStore } from '@/stores/bookStore';

describe('bookStore', () => {
  beforeEach(() => {
    useBookStore.setState({
      activeFilter: null,
      searchQuery: '',
      viewMode: 'grid',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('should have correct defaults', () => {
    const state = useBookStore.getState();
    expect(state.activeFilter).toBeNull();
    expect(state.searchQuery).toBe('');
    expect(state.viewMode).toBe('grid');
    expect(state.sortBy).toBe('createdAt');
    expect(state.sortOrder).toBe('desc');
  });

  it('should set active filter', () => {
    useBookStore.getState().setActiveFilter('READING');
    expect(useBookStore.getState().activeFilter).toBe('READING');
  });

  it('should clear active filter', () => {
    useBookStore.getState().setActiveFilter('UNREAD');
    useBookStore.getState().setActiveFilter(null);
    expect(useBookStore.getState().activeFilter).toBeNull();
  });

  it('should set search query', () => {
    useBookStore.getState().setSearchQuery('typescript');
    expect(useBookStore.getState().searchQuery).toBe('typescript');
  });

  it('should set view mode', () => {
    useBookStore.getState().setViewMode('list');
    expect(useBookStore.getState().viewMode).toBe('list');
  });

  it('should set sort by', () => {
    useBookStore.getState().setSortBy('title');
    expect(useBookStore.getState().sortBy).toBe('title');
  });

  it('should set sort order', () => {
    useBookStore.getState().setSortOrder('asc');
    expect(useBookStore.getState().sortOrder).toBe('asc');
  });
});
