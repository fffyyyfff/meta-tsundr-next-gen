"use client";

import { useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

const MAIN_NAV: NavItem[] = [
  { label: "ホーム", href: "/" },
  { label: "積読管理", href: "/books" },
  { label: "購入管理", href: "/purchases" },
  { label: "統計", href: "/books/stats" },
  { label: "ウィッシュリスト", href: "/purchases?status=WISHLIST" },
];

const SUB_NAV: NavItem[] = [
  { label: "購入統計", href: "/purchases/stats" },
  { label: "読書統計", href: "/books/stats" },
  { label: "AI ダッシュボード", href: "/dashboard" },
  { label: "設定", href: "/settings" },
];

interface FullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenMenu({ isOpen, onClose }: FullscreenMenuProps) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    if (previousPathname.current !== pathname && isOpen) {
      onClose();
    }
    previousPathname.current = pathname;
  }, [pathname, isOpen, onClose]);

  // ESC key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Focus trap: focus close button on open
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const closeBtn = menuRef.current.querySelector<HTMLButtonElement>(
        "[data-close-btn]"
      );
      closeBtn?.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-modal="true"
      aria-label="ナビゲーションメニュー"
      className={`fixed inset-0 z-[60] flex transition-transform duration-500 ease-out ${
        isOpen ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Left column - accent background */}
      <div className="relative flex w-full flex-col justify-between bg-[var(--page-accent)] p-8 md:w-[65%] md:p-16">
        {/* Main nav */}
        <nav className="mt-16 flex flex-col space-y-4 md:mt-24">
          {MAIN_NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="text-3xl font-bold text-white opacity-0 transition-colors hover:text-white/70 md:text-5xl"
              style={
                isOpen
                  ? {
                      animation: `fade-in-up 0.4s ease-out ${i * 0.05}s forwards`,
                    }
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sub links */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 pb-4 md:pb-8">
          {SUB_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="text-sm text-white/80 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right column - dark background */}
      <div className="hidden flex-col items-center justify-between bg-slate-900 p-8 md:flex md:w-[35%] md:p-16">
        {/* Close button */}
        <div className="flex w-full justify-end">
          <button
            data-close-btn
            onClick={onClose}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
            aria-label="メニューを閉じる"
          >
            <X className="size-8" />
          </button>
        </div>

        {/* CTA section */}
        <div className="flex flex-col items-center text-center">
          <p className="mb-3 text-sm text-white/60">アイデアを管理しよう</p>
          <p className="mb-6 whitespace-pre-line text-2xl font-bold text-white">
            {"すべての購入を\n記憶する"}
          </p>
          <Link
            href="/purchases/new"
            onClick={onClose}
            className="rounded-full border border-[var(--page-accent)] px-6 py-2 text-[var(--page-accent)] transition-colors hover:bg-[var(--page-accent)] hover:text-white"
          >
            はじめる
          </Link>
        </div>

        {/* Spacer */}
        <div />
      </div>

      {/* Mobile close button (visible on small screens) */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-2 text-white transition-colors hover:bg-white/10 md:hidden"
        aria-label="メニューを閉じる"
      >
        <X className="size-6" />
      </button>
    </div>
  );
}
