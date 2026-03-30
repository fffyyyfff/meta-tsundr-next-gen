'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // Wait for hydration before redirecting
    const user = useAuthStore.getState();
    if (!user.isAuthenticated) {
      // Re-check after hydrate in case cookie exists
      hydrate();
      const afterHydrate = useAuthStore.getState();
      if (!afterHydrate.isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, hydrate, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
