import type { Metadata } from 'next';

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@codex/shared';

/** Open Graph locale codes (language_TERRITORY). */
const OG_LOCALES: Record<Locale, string> = { ar: 'ar_AR', en: 'en_US' };

export const SITE_NAME = 'Codex';

/** The generated per-locale share image (`app/[locale]/opengraph-image.tsx`). */
export const DEFAULT_OG_IMAGE = { path: '/opengraph-image', width: 1200, height: 630 } as const;

export interface MetadataInput {
  title: string;
  description: string;
  /**
   * Path without the locale prefix. Pass one per locale when they differ (localized slugs:
   * `{ ar: '/services/<slugAr>', en: '/services/<slugEn>' }`).
   */
  path: string | Record<Locale, string>;
  locale: Locale;
  /** Absolute image URL (e.g. Cloudinary); the locale's generated OG image otherwise. */
  image?: { url: string; width: number; height: number; alt: string } | undefined;
  /** Open Graph type: `article` for blog posts. */
  type?: 'website' | 'article';
  /** Keep the page out of search results (e.g. search result pages). */
  isNoIndex?: boolean;
}

const pathFor = (path: MetadataInput['path'], locale: Locale) =>
  typeof path === 'string' ? path : path[locale];

/** `/ar` for the home page, `/ar/services` otherwise (no trailing slash). */
export function localizedPath(locale: Locale, path: string): string {
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Page metadata: canonical URL, hreflang alternates (`ar`, `en`, `x-default` → Arabic), Open
 * Graph and Twitter cards. URLs are relative; `metadataBase` in the root layout makes them
 * absolute.
 */
export function buildMetadata({
  title,
  description,
  path,
  locale,
  image,
  type = 'website',
  isNoIndex = false,
}: MetadataInput): Metadata {
  const canonical = localizedPath(locale, pathFor(path, locale));
  const languages = Object.fromEntries(
    LOCALES.map((candidate) => [candidate, localizedPath(candidate, pathFor(path, candidate))]),
  );
  // A page's own openGraph replaces the layout's, file-based image included: always set one.
  const images = [
    image ?? {
      url: localizedPath(locale, DEFAULT_OG_IMAGE.path),
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      alt: SITE_NAME,
    },
  ];

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        'x-default': localizedPath(DEFAULT_LOCALE, pathFor(path, DEFAULT_LOCALE)),
      },
    },
    ...(isNoIndex && { robots: { index: false, follow: true } }),
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((candidate) => candidate !== locale).map(
        (candidate) => OG_LOCALES[candidate],
      ),
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map(({ url }) => url),
    },
  };
}
