"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

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

  return <>{children}</>;
}
