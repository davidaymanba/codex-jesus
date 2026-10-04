import { defineRouting } from 'next-intl/routing';

import { DEFAULT_LOCALE, LOCALES } from '@codex/shared/constants';

/** One year: a visitor who picked a language keeps it on their next visit. */
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * `/ar/...` (default) and `/en/...`, always prefixed. The first visit to `/` is routed by
 * `Accept-Language`; the choice is remembered in a cookie. Path segments are English in both
 * locales (`/ar/services`). hreflang alternates come only from `buildMetadata`: next-intl's
 * `Link` header would reuse the current slug for the other locale and point x-default at `/`.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeCookie: { name: 'NEXT_LOCALE', maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS, sameSite: 'lax' },
  alternateLinks: false,
});
