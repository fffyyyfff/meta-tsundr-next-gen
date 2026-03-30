"use client";

import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  // Apply theme on mount and listen for system preference changes
  useEffect(() => {
    const resolved = theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (useThemeStore.getState().theme === "system") {
        document.documentElement.classList.toggle("dark", mq.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const toggle = () => {
    const resolved = theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;
    setTheme(resolved === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={toggle}
      className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
