import {
  RateLimiterMemory,
  RateLimiterRedis,
  type RateLimiterAbstract,
} from 'rate-limiter-flexible';

import { redis, type RedisClient } from '@/lib/redis.js';

interface RateLimiterOptions {
  /** Distinguishes limiters sharing one store (e.g. `login-ip`). */
  keyPrefix: string;
  points: number;
  durationSeconds: number;
  /** Defaults to the shared client; tests pass one to simulate an outage. */
  client?: RedisClient | undefined;
}

const REDIS_KEY_PREFIX = 'rl';

/**
 * A Redis-backed limiter (shared across API instances) with an in-memory "insurance" limiter
 * that takes over while Redis is unset or down, so limits keep applying per instance.
 */
export function createRateLimiter({
  keyPrefix,
  points,
  durationSeconds,
  client = redis,
}: RateLimiterOptions): RateLimiterAbstract {
  const memory = new RateLimiterMemory({ keyPrefix, points, duration: durationSeconds });
  if (!client) return memory;
  return new RateLimiterRedis({
    storeClient: client,
    useRedisPackage: true,
    rejectIfRedisNotReady: true,
    keyPrefix: `${REDIS_KEY_PREFIX}:${keyPrefix}`,
    points,
    duration: durationSeconds,
    insuranceLimiter: memory,
  });
}
