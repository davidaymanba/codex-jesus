import 'server-only';

import { notFound } from 'next/navigation';

import { LOCALES, type Locale } from '@codex/shared';

import { permanentRedirect } from '@/lib/i18n/navigation';
import { slugIn, type LocalizedSlugs } from '@/lib/routes';

interface ResolveSlugInput<TRecord extends LocalizedSlugs> {
  /** The `[slug]` route parameter. */
  slug: string;
  locale: Locale;
  /** Looks the slug up in one locale's slug column; `null` when there is no such record. */
  load: (slug: string, locale: Locale) => Promise<TRecord | null>;
  toPath: (slug: string) => string;
}

/**
 * The `[slug]` route parameter, decoded once: depending on how the request arrived, Arabic
 * slugs may still be percent-encoded. Slugs never contain `%` themselves.
 */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/**
 * The record a localized-slug URL points at. A slug from the other locale (an old link, or the
 * language switcher before hydration) answers with a permanent redirect to this locale's slug;
 * an unknown slug is a 404.
 */
export async function resolveBySlug<TRecord extends LocalizedSlugs>({
  slug,
  locale,
  load,
  toPath,
}: ResolveSlugInput<TRecord>): Promise<TRecord> {
  const decoded = decodeSlug(slug);
  const record = await load(decoded, locale);
  if (record) return record;

  for (const other of LOCALES.filter((candidate) => candidate !== locale)) {
    const elsewhere = await load(decoded, other);
    if (elsewhere) {
      // Encoded: the target lands in a Location header, which must be ASCII.
      permanentRedirect({ href: toPath(encodeURIComponent(slugIn(elsewhere, locale))), locale });
    }
  }
  notFound();
}
