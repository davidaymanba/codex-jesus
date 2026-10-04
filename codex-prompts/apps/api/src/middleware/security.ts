import cors from 'cors';
import type { Request, RequestHandler } from 'express';
import helmet from 'helmet';

import { AUTH_COOKIES, CSRF_HEADER, REQUEST_ID_HEADER } from '@codex/shared';

import { HSTS_MAX_AGE_SECONDS, PERMISSIONS_POLICY } from '@/config/constants.js';
import { env } from '@/config/env.js';
import { ForbiddenError } from '@/lib/errors.js';

const CORS_MAX_AGE_SECONDS = 600;
const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Origins allowed to call the API with credentials (CLAUDE.md §8: allow-list only). */
export const ALLOWED_ORIGINS: readonly string[] = [new URL(env.FRONTEND_URL).origin];

const helmetHeaders = helmet({
  // JSON only: nothing may load, frame or be framed. /api/docs sets its own policy.
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
  strictTransportSecurity: { maxAge: HSTS_MAX_AGE_SECONDS, includeSubDomains: true, preload: true },
});

/**
 * Helmet's headers plus Permissions-Policy, and `Cache-Control: no-store` by default so no
 * response (tokens, admin data) is cached; public read routes opt in explicitly (Phase 3).
 */
export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
  res.setHeader('Cache-Control', 'no-store');
  helmetHeaders(req, res, next);
};

export const corsPolicy: RequestHandler = cors({
  origin: [...ALLOWED_ORIGINS],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', CSRF_HEADER, REQUEST_ID_HEADER],
  exposedHeaders: [
    REQUEST_ID_HEADER,
    'Retry-After',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],
  maxAge: CORS_MAX_AGE_SECONDS,
});

function hasAuthCookie(req: Request): boolean {
  const cookies: Record<string, unknown> = req.cookies;
  return AUTH_COOKIES.ACCESS_TOKEN in cookies || AUTH_COOKIES.REFRESH_TOKEN in cookies;
}

/**
 * Cross-site request forgery, first layer: a state-changing request from a browser must come
 * from an allowed origin. Browsers always send `Origin` on such requests; a request without
 * it is only accepted when it carries no session cookie (i.e. a non-browser client, which
 * gains nothing from forging). The CSRF token check on authenticated routes is the second layer.
 */
export const verifyOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  const origin = req.get('origin');
  const isAllowed = origin ? ALLOWED_ORIGINS.includes(origin) : !hasAuthCookie(req);
  next(isAllowed ? undefined : new ForbiddenError('CSRF_INVALID'));
};
