import { z } from 'zod';

import { TURNSTILE } from '@/config/constants.js';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

const verifyResponseSchema = z.object({ success: z.boolean() });

interface VerifierOptions {
  /** Unset (outside production only): the check is skipped. */
  secret: string | undefined;
  fetchImpl?: typeof fetch;
}

/**
 * Cloudflare Turnstile server-side check. Fails closed: a timeout, network error or
 * unexpected answer counts as a failed check, so an outage never lets bots through.
 */
export function createTurnstileVerifier({ secret, fetchImpl = fetch }: VerifierOptions) {
  return async function verifyTurnstile(token: string): Promise<boolean> {
    if (!secret) {
      logger.debug('Turnstile check skipped: TURNSTILE_SECRET_KEY is not set');
      return true;
    }
    try {
      const response = await fetchImpl(TURNSTILE.VERIFY_URL, {
        method: 'POST',
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(TURNSTILE.TIMEOUT_MS),
      });
      const result = verifyResponseSchema.safeParse(await response.json());
      return result.success && result.data.success;
    } catch (error) {
      logger.error({ err: error }, 'Turnstile verification failed; rejecting the submission');
      return false;
    }
  };
}

export const verifyTurnstile = createTurnstileVerifier({ secret: env.TURNSTILE_SECRET_KEY });
