import { CACHE_KEY_PREFIX, CACHE_TAG_VERSION_TTL_SECONDS } from '@/config/constants.js';
import { logger } from '@/lib/logger.js';
import { redis, type RedisClient } from '@/lib/redis.js';

export interface CacheOptions {
  ttlSeconds: number;
  /** Tags this entry belongs to (e.g. `['posts', 'post:<id>']`), for `invalidateTags`. */
  tags?: readonly string[];
}

/** `wrap` options: the TTL may depend on the loaded value (e.g. the next scheduled publish). */
export interface WrapOptions<TValue> extends Omit<CacheOptions, 'ttlSeconds'> {
  ttlSeconds: number | ((value: TValue) => number);
}

// KEYS: entry, tag sets…, tag versions… ARGV: value, ttl, tag count, check versions?, versions…
// Writes nothing when a tag was invalidated since the caller read its version, so a slow load
// can never re-cache data older than the latest write. Tag sets live as long as their
// longest-lived entry.
const SET_SCRIPT = `
local count = tonumber(ARGV[3])
if ARGV[4] == '1' then
  for i = 1, count do
    if (redis.call('GET', KEYS[1 + count + i]) or '0') ~= ARGV[4 + i] then return 0 end
  end
end
local ttl = tonumber(ARGV[2])
redis.call('SET', KEYS[1], ARGV[1], 'EX', ttl)
for i = 1, count do
  local tagKey = KEYS[1 + i]
  redis.call('SADD', tagKey, KEYS[1])
  if redis.call('TTL', tagKey) < ttl then redis.call('EXPIRE', tagKey, ttl) end
end
return 1`;

// KEYS: tag sets…, tag versions… ARGV: version ttl. UNLINK frees memory off the main thread;
// batches keep `unpack` under Lua's stack limit. Bumping the version voids in-flight loads.
const INVALIDATE_TAGS_SCRIPT = `
local count = #KEYS / 2
for t = 1, count do
  local members = redis.call('SMEMBERS', KEYS[t])
  for i = 1, #members, 500 do
    redis.call('UNLINK', unpack(members, i, math.min(i + 499, #members)))
  end
  redis.call('UNLINK', KEYS[t])
  redis.call('INCR', KEYS[count + t])
  redis.call('EXPIRE', KEYS[count + t], ARGV[1])
end
return count`;

const SCAN_BATCH = 500;
const entryKey = (key: string): string => `${CACHE_KEY_PREFIX}:${key}`;
const tagKey = (tag: string): string => `${CACHE_KEY_PREFIX}:tag:${tag}`;
const tagVersionKey = (tag: string): string => `${CACHE_KEY_PREFIX}:tagver:${tag}`;

async function flushNamespace(client: RedisClient): Promise<void> {
  for await (const keys of client.scanIterator({
    MATCH: `${CACHE_KEY_PREFIX}:*`,
    COUNT: SCAN_BATCH,
  })) {
    if (keys.length > 0) await client.unlink(keys);
  }
}

/**
 * Redis cache with tag-based invalidation. Every entry is a JSON string under
 * `cache:v1:<key>`; every tag is a Redis set `cache:v1:tag:<tag>` of the entry keys it
 * covers, plus a version counter bumped on invalidation. `invalidateTags` deletes the listed
 * sets and all their entries in one atomic script.
 *
 * Without Redis (unset or down) every read misses and writes are skipped, so callers always
 * fall back to the database. An invalidation missed during an outage flushes the whole
 * namespace once Redis is back, instead of serving stale entries until their TTL.
 */
export function createCache(client: RedisClient | undefined) {
  const inFlight = new Map<string, Promise<unknown>>();
  const isUsable = (): boolean => client?.isReady ?? false;
  let hasMissedInvalidation = false;

  client?.on('ready', () => {
    if (!hasMissedInvalidation) return;
    hasMissedInvalidation = false;
    flushNamespace(client).then(
      () => {
        logger.warn('Cache flushed after invalidations were missed during a Redis outage');
      },
      (error: unknown) => {
        hasMissedInvalidation = true;
        logger.error({ err: error }, 'Cache flush after a Redis outage failed');
      },
    );
  });

  async function get<TValue>(key: string): Promise<TValue | undefined> {
    if (!client || !isUsable()) return undefined;
    try {
      const raw = await client.get(entryKey(key));
      // Entries are only ever written by `set` from values of the caller's type.
      return raw === null ? undefined : (JSON.parse(raw) as TValue);
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache read failed');
      return undefined;
    }
  }

  /** Current version per tag ('0' when never invalidated); undefined when Redis is unusable. */
  async function readTagVersions(tags: readonly string[]): Promise<string[] | undefined> {
    if (!client || !isUsable()) return undefined;
    if (tags.length === 0) return [];
    try {
      const versions = await client.mGet(tags.map(tagVersionKey));
      return versions.map((version) => version ?? '0');
    } catch (error) {
      logger.warn({ err: error, tags }, 'Cache tag version read failed');
      return undefined;
    }
  }

  /**
   * Stores `value`. With `expectedVersions` (read before loading the value), the write is
   * dropped when any tag was invalidated in the meantime.
   */
  async function set(
    key: string,
    value: unknown,
    { ttlSeconds, tags = [] }: CacheOptions,
    expectedVersions?: readonly string[],
  ): Promise<void> {
    if (!client || !isUsable()) return;
    try {
      await client.eval(SET_SCRIPT, {
        keys: [entryKey(key), ...tags.map(tagKey), ...tags.map(tagVersionKey)],
        arguments: [
          JSON.stringify(value),
          String(ttlSeconds),
          String(tags.length),
          expectedVersions ? '1' : '0',
          ...(expectedVersions ?? []),
        ],
      });
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache write failed');
    }
  }

  /** Returns the cached value, or loads, caches and returns it. Concurrent misses share one load. */
  async function wrap<TValue>(
    key: string,
    options: WrapOptions<TValue>,
    load: () => Promise<TValue>,
  ): Promise<TValue> {
    const cached = await get<TValue>(key);
    if (cached !== undefined) return cached;

    const pending = inFlight.get(key);
    // Same key, same loader contract: the pending promise resolves to TValue.
    if (pending) return pending as Promise<TValue>;

    const loading = (async () => {
      const versions = await readTagVersions(options.tags ?? []);
      const value = await load();
      const { ttlSeconds } = options;
      const ttl = typeof ttlSeconds === 'function' ? ttlSeconds(value) : ttlSeconds;
      if (versions && ttl > 0) await set(key, value, { ...options, ttlSeconds: ttl }, versions);
      return value;
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, loading);
    return loading;
  }

  /** Drops every entry carrying any of the tags. Failures are logged and repaired on reconnect. */
  async function invalidateTags(tags: readonly string[]): Promise<void> {
    if (!client || tags.length === 0) return;
    if (!isUsable()) {
      hasMissedInvalidation = true;
      return;
    }
    try {
      await client.eval(INVALIDATE_TAGS_SCRIPT, {
        keys: [...tags.map(tagKey), ...tags.map(tagVersionKey)],
        arguments: [String(CACHE_TAG_VERSION_TTL_SECONDS)],
      });
    } catch (error) {
      hasMissedInvalidation = true;
      logger.error({ err: error, tags }, 'Cache invalidation failed; flushing on reconnect');
    }
  }

  return { get, set, wrap, invalidateTags };
}

export type Cache = ReturnType<typeof createCache>;

/** The process-wide cache on the shared Redis client. */
export const cache: Cache = createCache(redis);
