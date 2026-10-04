import { locale as rootLocale } from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import type { Locale } from '@codex/shared';

import { routing } from './routing';

// Explicit imports (not a template path) keep each catalog typed and statically analyzable.
const CATALOGS = {
  ar: () => import('../../messages/ar.json'),
  en: () => import('../../messages/en.json'),
} satisfies Record<Locale, () => Promise<{ default: object }>>;

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  // An explicit `getTranslations({ locale })` wins; otherwise the `[locale]` root segment.
  const requested = explicitLocale ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: (await CATALOGS[locale]()).default };
});
