import type { RequestHandler } from 'express';

import { RATE_LIMITS } from '@/config/constants.js';
import { createRateLimiter } from '@/lib/rate-limiter.js';
import { rateLimit } from '@/middleware/rate-limit.js';

import { getAuth, requireAuth, requireCsrf } from './auth.middleware.js';

const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

const requireCsrfOnWrites: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  requireCsrf(req, res, next);
};

/**
 * `requireAuth`, with every failure charged to the client IP like any anonymous request.
 * Admin paths skip the per-IP limit (offices share one IP; signed-in users are limited per
 * user), so without this, requests without a session would never be throttled.
 */
function requireAuthChargingFailures(limitPerIp: RequestHandler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(requireAuth(req, res, next)).catch((authError: unknown) => {
      limitPerIp(req, res, (limitError?: unknown) => {
        next(limitError ?? authError);
      });
    });
  };
}

/**
 * Runs once in front of every `/admin` route (deny by default): a valid session, the
 * per-user rate limit, and CSRF on state-changing requests. Routes add their permission.
 */
export function adminGate(): RequestHandler[] {
  const perUser = createRateLimiter({ keyPrefix: 'admin-user', ...RATE_LIMITS.ADMIN_PER_USER });
  // Same keys as the global per-IP limiter: anonymous admin calls share the IP's budget.
  const perIp = createRateLimiter({ keyPrefix: 'global', ...RATE_LIMITS.GLOBAL });
  return [
    requireAuthChargingFailures(rateLimit(perIp)),
    rateLimit(perUser, { keyOf: (req) => getAuth(req).userId }),
    requireCsrfOnWrites,
  ];
}
