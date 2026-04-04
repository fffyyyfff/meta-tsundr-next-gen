"use client";

import { useI18n } from "@/shared/i18n/provider";
import { Button } from "@/shared/ui/button";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
      className="px-2 font-mono text-xs"
      aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切替'}
    >
      {locale === 'ja' ? 'EN' : 'JA'}
    </Button>
  );
}
