import { describe, expect, it } from 'vitest';

import { signRevalidation, verifyRevalidation } from './revalidation-signature.js';
import { REVALIDATION } from '../constants/revalidation.js';

const SECRET = 'a-test-secret-that-is-long-enough-000';
const BODY = JSON.stringify({ tags: ['posts', 'posts:1'] });
const NOW = new Date('2026-09-30T12:00:00Z');
const timestampAt = (date: Date) => String(Math.floor(date.getTime() / 1000));

async function request(overrides: Partial<Parameters<typeof verifyRevalidation>[0]> = {}) {
  const timestamp = timestampAt(NOW);
  const signature = await signRevalidation(SECRET, timestamp, BODY);
  return { secret: SECRET, timestamp, signature, body: BODY, now: NOW, ...overrides };
}

describe('revalidation signature', () => {
  it('produces a versioned hex HMAC that verifies', async () => {
    const valid = await request();
    expect(valid.signature).toMatch(/^v1=[0-9a-f]{64}$/);
    expect(await verifyRevalidation(valid)).toBe(true);
  });

  it('rejects a changed body, another secret or a forged signature', async () => {
    expect(await verifyRevalidation(await request({ body: '{"tags":["all"]}' }))).toBe(false);
    expect(await verifyRevalidation(await request({ secret: 'another-secret' }))).toBe(false);
    expect(await verifyRevalidation(await request({ signature: `v1=${'0'.repeat(64)}` }))).toBe(
      false,
    );
    expect(await verifyRevalidation(await request({ signature: 'v1=zz' }))).toBe(false);
    expect(await verifyRevalidation(await request({ signature: null }))).toBe(false);
  });

  it('rejects requests older than the replay window', async () => {
    const tooOld = new Date(NOW.getTime() - (REVALIDATION.MAX_AGE_SECONDS + 1) * 1000);
    const timestamp = timestampAt(tooOld);
    const signature = await signRevalidation(SECRET, timestamp, BODY);

    expect(await verifyRevalidation({ ...(await request()), timestamp, signature })).toBe(false);
  });
});
