'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Simple auth guard: check cookie or localStorage for user session
    const hasSession =
      document.cookie.includes('auth-token') ||
      localStorage.getItem('auth-user') !== null;

    if (!hasSession) {
      // In dev mode, allow access with a default user
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

  return <>{children}</>;
}
