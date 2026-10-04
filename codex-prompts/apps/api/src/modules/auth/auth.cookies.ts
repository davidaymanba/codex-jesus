import type { CookieOptions, Response } from 'express';

import { AUTH_COOKIES, AUTH_TOKEN_TTL } from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { env } from '@/config/env.js';

import type { SessionTokens } from './session.service.js';

const MS_PER_SECOND = 1000;
/** The refresh token is only ever sent to the auth routes. */
export const REFRESH_COOKIE_PATH = `${API_PREFIX}/auth`;

const baseOptions: CookieOptions = {
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
};

const accessOptions: CookieOptions = { ...baseOptions, httpOnly: true, path: '/' };
const refreshOptions: CookieOptions = { ...baseOptions, httpOnly: true, path: REFRESH_COOKIE_PATH };
// Readable by the admin client, which echoes it in the X-CSRF-Token header.
const csrfOptions: CookieOptions = { ...baseOptions, httpOnly: false, path: '/' };

export function setAccessCookie(res: Response, accessToken: string): void {
  res.cookie(AUTH_COOKIES.ACCESS_TOKEN, accessToken, {
    ...accessOptions,
    maxAge: AUTH_TOKEN_TTL.ACCESS_SECONDS * MS_PER_SECOND,
  });
}

export function setSessionCookies(res: Response, tokens: SessionTokens): void {
  setAccessCookie(res, tokens.accessToken);
  res.cookie(AUTH_COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
    ...refreshOptions,
    expires: tokens.refreshExpiresAt,
  });
  res.cookie(AUTH_COOKIES.CSRF_TOKEN, tokens.csrfToken, {
    ...csrfOptions,
    expires: tokens.refreshExpiresAt,
  });
}

export function clearSessionCookies(res: Response): void {
  res.clearCookie(AUTH_COOKIES.ACCESS_TOKEN, accessOptions);
  res.clearCookie(AUTH_COOKIES.REFRESH_TOKEN, refreshOptions);
  res.clearCookie(AUTH_COOKIES.CSRF_TOKEN, csrfOptions);
}
