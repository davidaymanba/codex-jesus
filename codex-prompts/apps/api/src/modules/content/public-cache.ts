import { PUBLIC_CACHE_TTL_SECONDS } from '@/config/constants.js';
import { cache } from '@/lib/cache.js';

const MS_PER_SECOND = 1000;

interface PublicReadOptions<TValue> {
  key: string;
  tags: readonly string[];
  load: () => Promise<TValue>;
  /** When the result changes on its own (the next scheduled publish), if ever. */
  nextChangeAt?: () => Promise<Date | null>;
}

interface Cached<TValue> {
  value: TValue;
  expiresAt: number | null;
}

/**
 * Serves a public read from Redis (1 hour, tag-invalidated on write). With `nextChangeAt`,
 * the entry expires no later than the next scheduled publish, so a post scheduled for 09:00
 * appears at 09:00 even though nobody wrote anything.
 */
export async function readPublic<TValue>({
  key,
  tags,
  load,
  nextChangeAt,
}: PublicReadOptions<TValue>): Promise<TValue> {
  const cached = await cache.wrap<Cached<TValue>>(
    `public:${key}`,
    {
      tags,
      ttlSeconds: ({ expiresAt }) =>
        expiresAt === null
          ? PUBLIC_CACHE_TTL_SECONDS
          : Math.min(
              PUBLIC_CACHE_TTL_SECONDS,
              Math.floor((expiresAt - Date.now()) / MS_PER_SECOND),
            ),
    },
    async () => {
      const [value, changeAt] = await Promise.all([load(), nextChangeAt?.() ?? null]);
      return { value, expiresAt: changeAt?.getTime() ?? null };
    },
  );
  return cached.value;
}

/** A stable cache key for a query object (key order never splits entries). */
export function queryKey(prefix: string, query: object): string {
  const entries = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `${prefix}:${JSON.stringify(entries)}`;
}
