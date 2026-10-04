import type { Request, RequestHandler } from 'express';

import {
  AUTH_COOKIES,
  CSRF_HEADER,
  hasPermission,
  type Permission,
  type Role,
} from '@codex/shared';

import { ForbiddenError, UnauthorizedError } from '@/lib/errors.js';

import { credentialsVersionOf, verifyAccessToken } from './access-token.js';
import { AuthUserRepository } from './auth-user.repository.js';
import type { AuthContext } from './auth.types.js';
import { assertValidCsrf } from './csrf.js';

const users = new AuthUserRepository();

function readCookie(req: Request, name: string): string | undefined {
  const value: unknown = req.cookies[name];
  return typeof value === 'string' ? value : undefined;
}

/** The CSRF token pair a browser sends back: readable cookie + echoed header. */
export function readCsrfPair(req: Request): {
  cookie: string | undefined;
  header: string | undefined;
} {
  return { cookie: readCookie(req, AUTH_COOKIES.CSRF_TOKEN), header: req.get(CSRF_HEADER) };
}

export function readRefreshToken(req: Request): string | undefined {
  return readCookie(req, AUTH_COOKIES.REFRESH_TOKEN);
}

/** The context `requireAuth` attached; a route that forgot `requireAuth` fails closed. */
export function getAuth(req: Pick<Request, 'auth'>): AuthContext {
  if (!req.auth) throw new UnauthorizedError();
  return req.auth;
}

/**
 * Verifies the access-token cookie, then re-checks the user and the session in one database
 * query: logout, deactivation, role and password changes take effect immediately, not after
 * 15 minutes.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = readCookie(req, AUTH_COOKIES.ACCESS_TOKEN);
  if (!token) throw new UnauthorizedError();
  const claims = await verifyAccessToken(token);

  const user = await users.findActiveSessionUser(claims.sub, claims.sid, new Date());
  // Exact match: a token from before a password change is rejected even within the same second.
  const isCurrent = user ? claims.cv === credentialsVersionOf(user.passwordChangedAt) : false;
  if (!user?.isActive || !isCurrent) throw new UnauthorizedError();

  req.auth = { userId: user.id, role: user.role, sessionId: claims.sid };
  next();
};

/** Double-submit CSRF check bound to the session (run after `requireAuth`). */
export const requireCsrf: RequestHandler = (req, _res, next) => {
  const { cookie, header } = readCsrfPair(req);
  assertValidCsrf(getAuth(req).sessionId, cookie, header);
  next();
};

/** Allows only the listed roles (deny by default). Prefer `requirePermission`. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!roles.includes(getAuth(req).role)) throw new ForbiddenError();
    next();
  };
}

/** Allows roles granted `permission` by the shared permission matrix. */
export function requirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    if (!hasPermission(getAuth(req).role, permission)) throw new ForbiddenError();
    next();
  };
}
