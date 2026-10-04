/**
 * Contract of the web revalidation webhook (docs/phases/03 §8 and 04 §9). The API signs
 * `HMAC-SHA256(REVALIDATE_SECRET, "<timestamp>.<raw body>")`; the web route verifies it and
 * rejects anything older than `MAX_AGE_SECONDS`.
 */
export const REVALIDATION = {
  PATH: '/api/revalidate',
  TIMESTAMP_HEADER: 'x-codex-timestamp',
  SIGNATURE_HEADER: 'x-codex-signature',
  /** Signature header format: `v1=<hex>`. The prefix allows rotating the scheme later. */
  SIGNATURE_VERSION: 'v1',
  MAX_AGE_SECONDS: 300,
  MAX_TAGS: 100,
  TAG_MAX_LENGTH: 200,
} as const;
