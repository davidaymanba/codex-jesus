import { createHash, createHmac } from 'node:crypto';

import { env } from '@/config/env.js';

/**
 * Keyed hash of a client IP (CLAUDE.md §8: raw IPs are never stored). An HMAC rather than a
 * salted SHA-256, so the 2^32 IPv4 space cannot be brute-forced without the secret.
 */
export function hashIp(ip: string | undefined): string {
  return createHmac('sha256', env.IP_HASH_SECRET)
    .update(ip ?? 'unknown')
    .digest('hex');
}

/** Keyed hash of an identifier (e.g. an email) used only as a rate-limit or lookup key. */
export function hashIdentifier(value: string): string {
  return createHmac('sha256', env.IP_HASH_SECRET).update(`id:${value}`).digest('hex');
}

/** Unkeyed SHA-256 hex; enough for 256-bit random tokens, which cannot be guessed. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
