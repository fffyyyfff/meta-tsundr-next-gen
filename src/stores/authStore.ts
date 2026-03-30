import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

function getUserFromCookie(): AuthUser | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('user_info='));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('='))) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user) => set({ user, isAuthenticated: true }),

  logout: () => {
    // Clear cookies
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'user_info=; path=/; max-age=0';
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  hydrate: () => {
    const user = getUserFromCookie();
    if (user) {
      set({ user, isAuthenticated: true });
    }
  },
}));
