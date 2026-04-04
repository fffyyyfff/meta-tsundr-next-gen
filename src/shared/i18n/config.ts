export const defaultLocale = 'ja' as const;
export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];
