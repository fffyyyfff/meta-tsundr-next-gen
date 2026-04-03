"use client";

import { useState, useCallback } from "react";
import { NotificationBell } from "@/shared/components/notification-bell";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { FullscreenMenu } from "@/shared/components/fullscreen-menu";

export function HeaderActions() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClose = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="relative ml-1 flex size-9 flex-col items-center justify-center gap-[5px] rounded-md transition-colors hover:bg-accent"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
        >
          <span
            className="block h-0.5 w-5 rounded-full bg-[var(--page-accent)] transition-all duration-300"
            style={
              menuOpen
                ? { transform: "translateY(3.5px) rotate(45deg)" }
                : undefined
            }
          />
          <span
            className="block h-0.5 w-5 rounded-full bg-[var(--page-accent)] transition-all duration-300"
            style={
              menuOpen
                ? { transform: "translateY(-3.5px) rotate(-45deg)" }
                : undefined
            }
          />
        </button>
      </div>
      <FullscreenMenu isOpen={menuOpen} onClose={handleClose} />
    </>
  );
}
