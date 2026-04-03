import { create } from 'zustand';

type BookStatus = 'UNREAD' | 'READING' | 'FINISHED';
type SortBy = 'title' | 'author' | 'createdAt' | 'rating' | 'updatedAt';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface BookUIState {
  activeFilter: BookStatus | null;
  searchQuery: string;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  setActiveFilter: (filter: BookStatus | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
}

export const useBookStore = create<BookUIState>((set) => ({
  activeFilter: null,
  searchQuery: '',
  viewMode: 'grid',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
}));
