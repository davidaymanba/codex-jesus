/**
 * Cache tags shared by the API (Redis invalidation) and the web app (`revalidateTag`), so a
 * write invalidates the same data in both caches. Collection tags cover every list and page
 * of a type; entity tags cover one record.
 */
export const CACHE_TAGS = {
  SERVICES: 'services',
  PROJECTS: 'projects',
  POSTS: 'posts',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  TESTIMONIALS: 'testimonials',
  TEAM: 'team',
  CLIENTS: 'clients',
  SETTINGS: 'settings',
  /** Media is embedded in most public DTOs (alt text, URLs). */
  MEDIA: 'media',
  SITEMAP: 'sitemap',
} as const;

export type CollectionTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/** Tag of one record, e.g. `post:<id>`. */
export function entityTag(collection: CollectionTag, id: string): string {
  return `${collection}:${id}`;
}
