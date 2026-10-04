import type { MetadataRoute } from 'next';

import { LOCALES } from '@codex/shared';

import { clientEnv } from '@/env/client';
import { ROUTES } from '@/lib/routes';

/** Crawl everything public; never the admin, the API routes or the component showcase. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', ...LOCALES.map((locale) => `/${locale}${ROUTES.DEV_SHOWCASE}`)],
    },
    sitemap: new URL('/sitemap.xml', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  };
}
