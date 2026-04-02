"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const THEME_MAP: Record<string, string> = {
  "/books/stats": "stats",
  "/purchases/stats": "stats",
  "/books": "books",
  "/purchases": "purchases",
  "/dashboard": "dashboard",
};

function getPageTheme(pathname: string): string | null {
  // Check exact matches first (longer paths first)
  for (const [path, theme] of Object.entries(THEME_MAP)) {
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
