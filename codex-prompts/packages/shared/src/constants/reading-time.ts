import type { Locale } from './locales.js';

/** Average silent-reading speed per locale, in words per minute. */
export const READING_WORDS_PER_MINUTE: Readonly<Record<Locale, number>> = {
  ar: 180,
  en: 230,
};
