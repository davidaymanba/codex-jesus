import type { MetadataRoute } from 'next';

import { DEFAULT_LOCALE, LOCALES } from '@codex/shared';

import { clientEnv } from '@/env/client';
import { ROUTES } from '@/lib/routes';
import { localizedPath } from '@/lib/seo/metadata';

/** Pages that exist so far, with their sitemap priority. */
const STATIC_PAGES = [{ path: ROUTES.HOME, priority: 1 }] as const;

const absolute = (path: string) => new URL(path, clientEnv.NEXT_PUBLIC_SITE_URL).toString();

/**
 * Base sitemap: the pages that exist so far, once per locale with hreflang alternates.
 * Phase 5 adds the content pages from `/public/sitemap-data`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PAGES.flatMap(({ path, priority }) =>
    LOCALES.map((locale) => ({
      url: absolute(localizedPath(locale, path)),
      changeFrequency: 'weekly' as const,
      priority,
      alternates: {
        languages: {
          ...Object.fromEntries(
            LOCALES.map((candidate) => [candidate, absolute(localizedPath(candidate, path))]),
          ),
          'x-default': absolute(localizedPath(DEFAULT_LOCALE, path)),
        },
      },
    })),
  );
}
