import 'server-only';

import { logger } from '@/lib/logger';

/**
 * Loads data for a non-critical section: on failure the error is logged and `fallback` is
 * returned, so one failing section never takes the whole page down.
 */
export async function withFallback<TValue>(
  section: string,
  load: () => Promise<TValue>,
  fallback: TValue,
): Promise<TValue> {
  try {
    return await load();
  } catch (error) {
    logger.error('Section data failed to load; rendering its fallback', error, { section });
    return fallback;
  }
}
