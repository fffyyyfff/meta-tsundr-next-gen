'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PackageIcon } from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; icon: typeof PackageIcon; exact?: boolean }[] = [
  { href: '/purchases', label: '一覧', icon: PackageIcon, exact: true },
];

export default function PurchasesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const hasSession =
      document.cookie.includes('auth-token') ||
      document.cookie.includes('auth_token') ||
      localStorage.getItem('auth-user') !== null;

    if (!hasSession) {
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
      } else {
        router.replace('/login');
        return;
      }
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  const isDetailPage = /^\/purchases\/[^/]+/.test(pathname) && pathname !== '/purchases/new';

  return (
    <div>
      {!isDetailPage && (
        <nav className="border-b border-border" aria-label="購入管理ナビゲーション">
          <div className="container mx-auto flex items-center gap-1 px-4">
            {NAV_ITEMS.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-[var(--page-accent)] text-[var(--page-accent)]'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      {children}
    </div>
  );
}
