import { CACHE_TAGS, entityTag } from '@codex/shared';

import { PUBLICATION_CHECK_INTERVAL_MS } from '@/config/constants.js';
import { logger } from '@/lib/logger.js';

import { publishChanges } from './publish-changes.js';
import { ScheduledContentRepository } from './scheduled-content.repository.js';

interface SchedulerOptions {
  findWentLive?: ScheduledContentRepository['findWentLive'];
  publish?: (tags: readonly string[]) => Promise<void>;
  intervalMs?: number;
  now?: () => Date;
}

/** Cache tags of content that just went live. */
function tagsFor({ posts, projects }: { posts: string[]; projects: string[] }): string[] {
  return [
    ...(posts.length > 0
      ? [CACHE_TAGS.POSTS, ...posts.map((id) => entityTag(CACHE_TAGS.POSTS, id))]
      : []),
    ...(projects.length > 0
      ? [CACHE_TAGS.PROJECTS, ...projects.map((id) => entityTag(CACHE_TAGS.PROJECTS, id))]
      : []),
    ...(posts.length + projects.length > 0 ? [CACHE_TAGS.SITEMAP] : []),
  ];
}

/**
 * Scheduled publishing needs no write to happen: every interval, content whose publish time
 * just passed is announced (Redis invalidation + the web revalidation webhook). Public cache
 * entries already expire at the next publish time; this tells the web app's own cache.
 * Idempotent, so several API instances may run it; a restart longer than one interval can
 * miss an announcement (the web app's ISR revalidate period then covers it).
 */
export function startPublicationScheduler({
  findWentLive = (from, to) => new ScheduledContentRepository().findWentLive(from, to),
  publish = publishChanges,
  intervalMs = PUBLICATION_CHECK_INTERVAL_MS,
  now = () => new Date(),
}: SchedulerOptions = {}): { tick: () => Promise<void>; stop: () => void } {
  let checkedUntil = now();

  async function tick(): Promise<void> {
    const until = now();
    try {
      const tags = tagsFor(await findWentLive(checkedUntil, until));
      checkedUntil = until;
      if (tags.length > 0) await publish(tags);
    } catch (error) {
      // The window stays open: the next tick retries it.
      logger.error({ err: error }, 'Scheduled publication check failed');
    }
  }

  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  return {
    tick,
    stop: () => {
      clearInterval(timer);
    },
  };
}
