import type { Request, RequestHandler } from 'express';

import { ERROR_CODES, FIELD_LIMITS, FORM_RATE_LIMIT, HONEYPOT_FIELD } from '@codex/shared';

import { AppError } from '@/lib/errors.js';
import { logger } from '@/lib/logger.js';
import { createRateLimiter } from '@/lib/rate-limiter.js';
import { verifyTurnstile } from '@/lib/turnstile.js';
import { rateLimit } from '@/middleware/rate-limit.js';
import { sendCreated } from '@/utils/response.js';

/** The raw (not yet validated) body field, if it is a string. */
function bodyString(req: Request, field: string): string | undefined {
  const body: unknown = req.body;
  if (typeof body !== 'object' || body === null || !(field in body)) return undefined;
  const value: unknown = (body as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
}

/** Strict per-IP limit for one public form (CLAUDE.md §8): 5 submissions per hour. */
export function formRateLimit(form: string): RequestHandler {
  return rateLimit(
    createRateLimiter({
      keyPrefix: `form-${form}`,
      points: FORM_RATE_LIMIT.POINTS,
      durationSeconds: FORM_RATE_LIMIT.DURATION_SECONDS,
    }),
  );
}

/**
 * A filled honeypot means a bot: answer exactly like a success (so it learns nothing) and
 * store nothing.
 */
export const honeypot: RequestHandler = (req, res, next) => {
  if (!bodyString(req, HONEYPOT_FIELD)) {
    next();
    return;
  }
  logger.info({ path: req.path }, 'Honeypot filled; submission discarded');
  sendCreated(res, { received: true });
};

/** Cloudflare Turnstile token check, before the form is even validated. */
export const requireTurnstile: RequestHandler = async (_req, _res, next) => {
  const token = bodyString(_req, 'turnstileToken');
  const isHuman =
    token !== undefined &&
    token.length <= FIELD_LIMITS.OPAQUE_TOKEN_MAX &&
    (await verifyTurnstile(token));
  if (!isHuman) throw new AppError({ statusCode: 403, code: ERROR_CODES.BOT_CHECK_FAILED });
  next();
};
