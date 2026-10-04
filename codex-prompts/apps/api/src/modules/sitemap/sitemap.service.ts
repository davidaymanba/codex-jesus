import { CACHE_TAGS, type SitemapDataDto } from '@codex/shared';

import { readPublic } from '@/modules/content/public-cache.js';

import { SitemapRepository } from './sitemap.repository.js';

const sitemap = new SitemapRepository();

const toEntry = (row: { slugAr: string; slugEn: string; updatedAt: Date }) => ({
  slugAr: row.slugAr,
  slugEn: row.slugEn,
  updatedAt: row.updatedAt.toISOString(),
});

/** Published slugs with their last change, for the web app's sitemap.xml (both locales). */
export function getSitemapData(): Promise<SitemapDataDto> {
  return readPublic({
    key: 'sitemap',
    tags: [CACHE_TAGS.SITEMAP],
    nextChangeAt: () => sitemap.nextScheduledAt(new Date()),
    load: async () => {
      const rows = await sitemap.findPublishedEntries(new Date());
      return {
        services: rows.services.map(toEntry),
        projects: rows.projects.map(toEntry),
        posts: rows.posts.map(toEntry),
        categories: rows.categories.map((row) => ({ ...toEntry(row), type: row.type })),
      };
    },
  });
}
