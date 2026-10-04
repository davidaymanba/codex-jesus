import 'server-only';

import { CACHE_TAGS, sitemapDataDtoSchema } from '@codex/shared';

import { apiFetch } from './client';

/** Published slugs with their last change, for sitemap.xml. */
export async function getSitemapData() {
  return (
    await apiFetch({
      path: '/public/sitemap-data',
      schema: sitemapDataDtoSchema,
      tags: [CACHE_TAGS.SITEMAP],
    })
  ).data;
}
