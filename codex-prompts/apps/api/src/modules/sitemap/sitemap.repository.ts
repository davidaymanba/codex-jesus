import { ContentStatus, PAGINATION } from '@codex/shared';

import { BaseRepository } from '@/lib/base-repository.js';
import { publishedWhere } from '@/modules/content/publication.js';

// Everything published, in one list per type: far below this cap for an agency site, and a
// cap keeps the query bounded if content ever grows (then the sitemap would be split).
const SITEMAP_MAX_ENTRIES = PAGINATION.MAX_PAGE * PAGINATION.MAX_PAGE_SIZE;
const entry = { slugAr: true, slugEn: true, updatedAt: true } as const;
const newestFirst = [{ updatedAt: 'desc' }, { id: 'asc' }] as const;

export class SitemapRepository extends BaseRepository {
  async findPublishedEntries(now: Date) {
    const take = SITEMAP_MAX_ENTRIES;
    const orderBy = [...newestFirst];
    const [services, projects, posts, categories] = await Promise.all([
      this.db.service.findMany({
        where: { status: ContentStatus.PUBLISHED },
        select: entry,
        orderBy,
        take,
      }),
      this.db.project.findMany({ where: publishedWhere(now), select: entry, orderBy, take }),
      this.db.post.findMany({ where: publishedWhere(now), select: entry, orderBy, take }),
      this.db.category.findMany({ select: { ...entry, type: true }, orderBy, take }),
    ]);
    return { services, projects, posts, categories };
  }

  /** The next scheduled post or project publish: the sitemap changes then. */
  async nextScheduledAt(now: Date): Promise<Date | null> {
    const scheduled = { status: ContentStatus.PUBLISHED, publishedAt: { gt: now } } as const;
    const select = { publishedAt: true } as const;
    const orderBy = { publishedAt: 'asc' } as const;
    const [post, project] = await Promise.all([
      this.db.post.findFirst({ where: scheduled, select, orderBy }),
      this.db.project.findFirst({ where: scheduled, select, orderBy }),
    ]);
    const times = [post?.publishedAt, project?.publishedAt].filter((time) => time instanceof Date);
    return times.length > 0 ? new Date(Math.min(...times.map((time) => time.getTime()))) : null;
  }
}
