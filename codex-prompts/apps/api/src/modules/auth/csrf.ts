import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { env } from '@/config/env.js';
import { ForbiddenError } from '@/lib/errors.js';

const NONCE_BYTES = 16;
const SEPARATOR = '.';

function sign(sessionId: string, nonce: string): string {
  return createHmac('sha256', env.CSRF_SECRET)
    .update(`${sessionId}${SEPARATOR}${nonce}`)
    .digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * A signed double-submit token bound to the session (OWASP "signed double-submit cookie"):
 * `nonce.HMAC(sessionId.nonce)`. A sibling subdomain able to plant cookies still cannot mint
 * a token that validates for someone else's session.
 */
export function issueCsrfToken(sessionId: string): string {
  const nonce = randomBytes(NONCE_BYTES).toString('base64url');
  return `${nonce}${SEPARATOR}${sign(sessionId, nonce)}`;
}

/** Throws 403 unless the header equals the cookie and the token was signed for this session. */
export function assertValidCsrf(
  sessionId: string,
  cookieToken: string | undefined,
  headerToken: string | undefined,
): void {
  const isValid = (() => {
    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) return false;
    const [nonce, signature] = headerToken.split(SEPARATOR);
    return Boolean(nonce && signature && safeEqual(signature, sign(sessionId, nonce)));
  })();
  if (!isValid) throw new ForbiddenError('CSRF_INVALID');
}
