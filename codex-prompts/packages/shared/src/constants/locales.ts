/** Supported site locales. Arabic is the default (RTL). */
export const LOCALES = ['ar', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** Locale served when none is requested or detected. */
export const DEFAULT_LOCALE: Locale = 'ar';

/** Locales rendered right-to-left. */
export const RTL_LOCALES: readonly Locale[] = ['ar'];
