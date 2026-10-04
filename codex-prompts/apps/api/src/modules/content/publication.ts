import { ContentStatus } from '@codex/shared';

/**
 * "Published" for dated content (posts, projects): the status says so and the publish time
 * has arrived. A future `publishedAt` is a scheduled publish, not yet public.
 */
export function publishedWhere(now: Date) {
  return { status: ContentStatus.PUBLISHED, publishedAt: { lte: now } } as const;
}

/**
 * The publish time stored for a write: publishing without a date means "now"; a draft keeps
 * whatever date it has (it only matters once published).
 */
export function resolvePublishedAt(
  status: ContentStatus | undefined,
  requested: string | null | undefined,
  current: Date | null,
  now: Date,
): Date | null | undefined {
  if (requested !== undefined) {
    if (requested !== null) return new Date(requested);
    return status === ContentStatus.PUBLISHED ? now : null;
  }
  if (status === ContentStatus.PUBLISHED && current === null) return now;
  return undefined;
}
