import { timingSafeEqual } from 'node:crypto';

import type { Request, RequestHandler } from 'express';

import { INTERNAL_API_HEADER } from '@codex/shared';

import { ADMIN_PATH, API_PREFIX, HEALTH_PATH, RATE_LIMITS } from '@/config/constants.js';
import { env } from '@/config/env.js';
import { createRateLimiter } from '@/lib/rate-limiter.js';
import { rateLimit } from '@/middleware/rate-limit.js';

const INTERNAL_KEY = 'web-server';
const ADMIN_PREFIX = `${API_PREFIX}${ADMIN_PATH}/`;

const expectedToken = env.INTERNAL_API_TOKEN ? Buffer.from(env.INTERNAL_API_TOKEN) : undefined;

/** True when the request carries the web server's internal token (constant-time check). */
export function isInternalRequest(req: Request): boolean {
  const presented = req.get(INTERNAL_API_HEADER);
  if (!expectedToken || !presented) return false;
  const actual = Buffer.from(presented);
  return actual.length === expectedToken.length && timingSafeEqual(actual, expectedToken);
}

// Probes run every few seconds from the platform; they must never be throttled.
const isHealthProbe = (req: Request): boolean => req.path.startsWith(HEALTH_PATH);
// Limited per user once signed in (see `adminGate`), not per shared office IP.
const isAdminRequest = (req: Request): boolean => req.path.startsWith(ADMIN_PREFIX);

/**
 * Per-traffic-type limits, in front of every route: browsers and unknown clients share a
 * per-IP budget; the web server (few egress IPs serving every visitor) gets its own bucket.
 */
export function trafficLimits(): RequestHandler[] {
  const perIp = createRateLimiter({ keyPrefix: 'global', ...RATE_LIMITS.GLOBAL });
  const internal = createRateLimiter({ keyPrefix: 'internal', ...RATE_LIMITS.INTERNAL });
  return [
    rateLimit(perIp, {
      skip: (req) => isHealthProbe(req) || isAdminRequest(req) || isInternalRequest(req),
    }),
    rateLimit(internal, { keyOf: () => INTERNAL_KEY, skip: (req) => !isInternalRequest(req) }),
  ];
}
