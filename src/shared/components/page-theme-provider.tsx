"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const THEME_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ["/books/stats", "stats"],
  ["/purchases/stats", "stats"],
  ["/books", "books"],
  ["/purchases", "purchases"],
  ["/dashboard", "dashboard"],
] as const;

function getPageTheme(pathname: string): string | null {
  // Exact matches first (sorted longest-path-first to avoid prefix collisions)
  for (const [path, theme] of THEME_ROUTES) {
    if (pathname === path) return theme;
  }
  // Then prefix matches
  if (pathname.startsWith("/books")) return "books";
  if (pathname.startsWith("/purchases")) return "purchases";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  return null; // home/default
}

export function PageThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Initialize dark mode theme on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const isDark = stored === 'dark' || (stored !== 'light' && matchMedia('(prefers-color-scheme:dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    setMounted(true);
  }, []);

  // Apply page theme
  useEffect(() => {
    const theme = getPageTheme(pathname);
    if (theme) {
      document.body.setAttribute("data-page-theme", theme);
    } else {
      document.body.removeAttribute("data-page-theme");
    }
    return () => {
      document.body.removeAttribute("data-page-theme");
    };
  }, [pathname]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return <>{children}</>;
}
