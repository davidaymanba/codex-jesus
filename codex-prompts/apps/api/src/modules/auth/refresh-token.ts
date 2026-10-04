import { randomBytes } from 'node:crypto';

import { AUTH_TOKEN_TTL } from '@codex/shared';

import { sha256 } from '@/lib/hash.js';

const TOKEN_BYTES = 32;
const MS_PER_SECOND = 1000;

/** A new opaque 256-bit refresh token and the SHA-256 hash that is stored instead of it. */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: sha256(token) };
}

export const hashRefreshToken = sha256;

/**
 * Sliding expiry (7 days from now) capped by the session's absolute lifetime (30 days from
 * login). Returns `undefined` when the session has already reached its maximum age.
 */
export function refreshExpiry(sessionStartedAt: Date, now = new Date()): Date | undefined {
  const sliding = now.getTime() + AUTH_TOKEN_TTL.REFRESH_SECONDS * MS_PER_SECOND;
  const absolute = sessionStartedAt.getTime() + AUTH_TOKEN_TTL.SESSION_MAX_SECONDS * MS_PER_SECOND;
  const expiresAt = Math.min(sliding, absolute);
  return expiresAt > now.getTime() ? new Date(expiresAt) : undefined;
}
