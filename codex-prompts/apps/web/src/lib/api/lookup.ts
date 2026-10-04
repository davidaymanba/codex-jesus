import 'server-only';

import { ApiClientError } from './errors';

/**
 * A detail lookup that may legitimately miss: `null` when the API has no such published
 * record (404) or rejects the slug's format (400). Other failures still throw (error page).
 */
export async function findOrNull<TValue>(load: () => Promise<TValue>): Promise<TValue | null> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

/** Path segment for a slug (Arabic slugs are percent-encoded on the wire). */
export const slugSegment = (slug: string): string => encodeURIComponent(slug);
