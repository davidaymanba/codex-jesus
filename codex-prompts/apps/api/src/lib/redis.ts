import { createClient } from '@redis/client';

import { REDIS_TIMEOUTS } from '@/config/constants.js';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

/** Exponential backoff capped at `RECONNECT_MAX_MS`; retries forever (Redis is optional). */
function reconnectDelay(retries: number): number {
  return Math.min(REDIS_TIMEOUTS.RECONNECT_BASE_MS * 2 ** retries, REDIS_TIMEOUTS.RECONNECT_MAX_MS);
}

/**
 * Redis is an accelerator, never a dependency: while it is down, commands fail fast (no
 * offline queue, short timeouts) and callers fall back (no cache, in-memory rate limits).
 * State changes are logged once each instead of on every reconnect attempt.
 */
export function createRedisClient(url: string) {
  const client = createClient({
    url,
    disableOfflineQueue: true,
    commandOptions: { timeout: REDIS_TIMEOUTS.COMMAND_MS },
    socket: {
      connectTimeout: REDIS_TIMEOUTS.CONNECT_MS,
      reconnectStrategy: reconnectDelay,
    },
  });

  let isAvailable = true;
  client.on('ready', () => {
    isAvailable = true;
    logger.info('Redis connected');
  });
  client.on('error', (error: unknown) => {
    if (!isAvailable) return;
    isAvailable = false;
    logger.warn(
      { err: error },
      'Redis unavailable; caching disabled and rate limits kept in memory',
    );
  });
  return client;
}

export type RedisClient = ReturnType<typeof createRedisClient>;

/** The process-wide client, or `undefined` when REDIS_URL is not set. Not yet connected. */
export const redis: RedisClient | undefined = env.REDIS_URL
  ? createRedisClient(env.REDIS_URL)
  : undefined;

/**
 * Starts connecting in the background. The API serves requests immediately; the client keeps
 * retrying until Redis is reachable.
 */
export function connectRedis(): void {
  if (!redis || redis.isOpen) return;
  redis.connect().catch((error: unknown) => {
    logger.warn({ err: error }, 'Redis connection attempt failed');
  });
}

/** Closes the connection (graceful shutdown). */
export async function closeRedis(): Promise<void> {
  if (!redis?.isOpen) return;
  await redis.close();
}

/** True when commands can be sent right now. */
export function isRedisReady(): boolean {
  return redis?.isReady ?? false;
}
