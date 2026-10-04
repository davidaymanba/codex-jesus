import type { Locale } from '@codex/shared';

/*
 * Fonts are self-hosted and declared in src/styles/fonts.css (not next/font): next/font
 * preloads every font of the layout on every page, which would push the Arabic files to
 * English pages and the reverse. Here each locale preloads only what its first screen uses.
 */

/** Maps the generic stack variables used by globals.css to the locale's families. */
export const FONT_STACK_CLASS: Record<Locale, string> = {
  ar: 'font-stack-ar',
  en: 'font-stack-en',
};

/** Font files the locale's first screen renders with: body text and bold headings. */
export const FONT_PRELOADS: Record<Locale, readonly string[]> = {
  ar: ['/fonts/noto-sans-arabic-300.v1.woff2', '/fonts/rubik-arabic-700.v1.woff2'],
  en: [
    '/fonts/inter-latin-300.v1.woff2',
    '/fonts/inter-latin-700.v1.woff2',
    '/fonts/archivo-latin-800.v1.woff2',
  ],
};
