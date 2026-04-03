'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { trpcReact } from '@/shared/lib/trpc-provider';
import { useNotificationStore } from '@/shared/stores/notificationStore';

const EVENT_ICONS: Record<string, string> = {
  'agent.completed': '✓',
  'agent.failed': '✗',
  'workflow.completed': '⚡',
};

interface NotificationBellProps {
  userId?: string;
}

export function NotificationBell({ userId = 'default-user' }: NotificationBellProps) {
  const { notifications, unreadCount, isOpen, setNotifications, markAsRead, toggleOpen, close } =
    useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpcReact.useUtils();

  const { data } = trpcReact.notification.listNotifications.useQuery(
    { userId, limit: 20 },
    { refetchInterval: 15_000 },
  );

  useEffect(() => {
    if (data) {
      setNotifications(data.notifications, data.unreadCount);
    }
  }, [data, setNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    markAsRead(unreadIds);
    await utils.notification.listNotifications.invalidate();
  }, [notifications, markAsRead, utils]);

  function formatTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={toggleOpen}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-border px-4 py-3 last:border-b-0 ${
                    n.read ? 'opacity-60' : 'bg-accent/30'
                  }`}
                >
                  <span className="mt-0.5 text-base leading-none">
                    {EVENT_ICONS[n.event] ?? '•'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
