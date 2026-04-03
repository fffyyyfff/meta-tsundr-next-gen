import { create } from 'zustand';

type ItemCategory = 'BOOK' | 'ELECTRONICS' | 'DAILY_GOODS' | 'FOOD' | 'CLOTHING' | 'HOBBY' | 'OTHER';
type ItemStatus = 'WISHLIST' | 'PURCHASED' | 'IN_USE' | 'COMPLETED' | 'RETURNED';
type SortBy = 'title' | 'price' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface ItemUIState {
  activeCategory: ItemCategory | null;
  activeStatus: ItemStatus | null;
  searchQuery: string;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  setActiveCategory: (category: ItemCategory | null) => void;
  setActiveStatus: (status: ItemStatus | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
}

export const useItemStore = create<ItemUIState>((set) => ({
  activeCategory: null,
  activeStatus: null,
  searchQuery: '',
  viewMode: 'grid',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setActiveStatus: (activeStatus) => set({ activeStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
}));
