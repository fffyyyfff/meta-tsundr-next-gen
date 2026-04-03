import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  event: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  setNotifications: (items: NotificationItem[], unreadCount: number) => void;
  markAsRead: (ids: string[]) => void;
  toggleOpen: () => void;
  close: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setNotifications: (items, unreadCount) =>
    set({ notifications: items, unreadCount }),

  markAsRead: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      const notifications = state.notifications.map((n) =>
        idSet.has(n.id) ? { ...n, read: true } : n,
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}));
