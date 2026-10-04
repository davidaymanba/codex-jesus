import type { Request, RequestHandler } from 'express';
import { RateLimiterRes, type RateLimiterAbstract } from 'rate-limiter-flexible';

import { RateLimitError } from '@/lib/errors.js';
import { hashIp } from '@/lib/hash.js';

const MS_PER_SECOND = 1000;

/** Keys requests by hashed client IP (resolved through `trust proxy`). */
export const byClientIp = (req: Request): string => hashIp(req.ip);

function setRateLimitHeaders(
  res: Parameters<RequestHandler>[1],
  limit: number,
  state: RateLimiterRes,
) {
  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, state.remainingPoints)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(state.msBeforeNext / MS_PER_SECOND)));
}

/**
 * Consumes one point per request; over the limit → 429 with `Retry-After`. `skip` exempts
 * requests such as health probes.
 */
export function rateLimit(
  limiter: RateLimiterAbstract,
  {
    keyOf = byClientIp,
    skip,
  }: { keyOf?: (req: Request) => string; skip?: (req: Request) => boolean } = {},
): RequestHandler {
  return (req, res, next) => {
    if (skip?.(req)) {
      next();
      return;
    }
    limiter.consume(keyOf(req)).then(
      (state) => {
        setRateLimitHeaders(res, limiter.points, state);
        next();
      },
      (rejection: unknown) => {
        if (!(rejection instanceof RateLimiterRes)) {
          next(rejection);
          return;
        }
        setRateLimitHeaders(res, limiter.points, rejection);
        next(new RateLimitError(Math.ceil(rejection.msBeforeNext / MS_PER_SECOND)));
      },
    );
  };
}
