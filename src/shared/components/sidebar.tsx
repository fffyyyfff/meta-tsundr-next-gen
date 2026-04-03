'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BookOpenIcon,
  BarChart3Icon,
  ShieldIcon,
  PackageIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  XIcon,
  PieChartIcon,
} from 'lucide-react';

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: typeof HomeIcon;
  badge?: string;
}> = [
  { href: '/', label: 'ホーム', icon: HomeIcon },
  { href: '/books', label: '積読管理', icon: BookOpenIcon },
  { href: '/books/stats', label: '統計', icon: BarChart3Icon },
  { href: '/purchases', label: '購入管理', icon: PackageIcon },
  { href: '/purchases/stats', label: '購入統計', icon: PieChartIcon },
  { href: '/purchases?status=WISHLIST', label: 'ウィッシュリスト', icon: HeartIcon },
  { href: '/dashboard', label: 'AI ダッシュボード', icon: ShieldIcon, badge: 'admin' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const closeMobileNav = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // ESC key to close + focus trap
  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMobileNav();
        return;
      }

      if (e.key === 'Tab' && navRef.current) {
        const focusable = navRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, closeMobileNav]);

  // Focus management: move focus into nav on open, restore to trigger on close
  useEffect(() => {
    if (mobileOpen) {
      // Focus the close button when nav opens
      requestAnimationFrame(() => {
        closeRef.current?.focus();
      });
    } else {
      // Restore focus to trigger when nav closes (only if trigger exists)
      triggerRef.current?.focus();
    }
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        ref={triggerRef}
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
        aria-label="メニューを開く"
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Mobile fullscreen overlay menu */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          ref={navRef}
          role="dialog"
          aria-modal="true"
          aria-label="ナビゲーションメニュー"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--page-accent)] md:hidden"
        >
          {/* Close button */}
          <button
            ref={closeRef}
            onClick={closeMobileNav}
            className="absolute right-4 top-4 rounded-md p-2 text-white/80 hover:text-white"
            aria-label="メニューを閉じる"
          >
            <XIcon className="h-6 w-6" />
          </button>

          {/* Nav items */}
          <nav className="space-y-6 text-center" aria-label="モバイルナビゲーション">
            {NAV_ITEMS.map((item, index) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileNav}
                  className={`flex items-center justify-center gap-3 text-3xl font-bold text-white transition-opacity ${
                    active ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    animation: `fade-in-up 0.4s ease-out ${index * 0.05}s both`,
                  }}
                >
                  <item.icon className="h-7 w-7 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 rounded bg-white/20 px-2 py-0.5 text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        suppressHydrationWarning
        className={`
          hidden md:flex fixed top-0 left-0 z-50 h-full flex-col border-r border-border bg-background transition-all duration-200
          ${collapsed ? 'w-16' : 'w-60'}
          md:relative
        `}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {!collapsed && (
            <Link href="/" className="text-base font-semibold text-foreground truncate">
              Meta-tsundr
            </Link>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          >
            {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 p-2" aria-label="サイドナビゲーション">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                  ${active
                    ? 'border-l-2 border-[var(--page-accent)] bg-[var(--page-accent-muted)] text-[var(--page-accent)]'
                    : 'border-l-2 border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }
                  ${collapsed ? 'justify-center px-2 border-l-0' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
