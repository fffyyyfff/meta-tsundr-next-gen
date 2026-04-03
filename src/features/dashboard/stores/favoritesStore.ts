import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteExecution {
  id: string;
  agentType: string;
  task: string;
  result: string | null;
  status: string;
  duration: number | null;
  tokenUsage?: number | null;
  createdAt: string;
  project?: { id: string; name: string } | null;
}

interface FavoritesState {
  favorites: FavoriteExecution[];
  add: (execution: FavoriteExecution) => void;
  remove: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      add: (execution) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === execution.id)) return state;
          return { favorites: [execution, ...state.favorites] };
        }),
      remove: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),
      isFavorite: (id) => get().favorites.some((f) => f.id === id),
      clear: () => set({ favorites: [] }),
    }),
    { name: 'meta-tsundr-favorites' },
  ),
);
