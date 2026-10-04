import { cache } from '@/lib/cache.js';
import { revalidator } from '@/lib/revalidation.js';

/**
 * Runs after a content write has committed (never inside the transaction: a reader could
 * re-cache the old row before the commit, and side effects cannot roll back). Drops the Redis
 * entries for `tags` and tells the web app to revalidate the same tags.
 */
export async function publishChanges(tags: readonly string[]): Promise<void> {
  await cache.invalidateTags(tags);
  revalidator.revalidate(tags);
}
