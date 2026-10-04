import { describe, expect, it, vi } from 'vitest';

import { createTurnstileVerifier } from './turnstile.js';

const answer = (body: unknown) =>
  vi.fn(() => Promise.resolve(Response.json(body))) as unknown as typeof fetch;

describe('Turnstile verifier', () => {
  it('passes only when Cloudflare answers success', async () => {
    const pass = createTurnstileVerifier({ secret: 's', fetchImpl: answer({ success: true }) });
    const fail = createTurnstileVerifier({ secret: 's', fetchImpl: answer({ success: false }) });
    const odd = createTurnstileVerifier({ secret: 's', fetchImpl: answer({ ok: 1 }) });

    expect(await pass('token')).toBe(true);
    expect(await fail('token')).toBe(false);
    expect(await odd('token')).toBe(false);
  });

  it('fails closed on network errors', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('timeout'))) as unknown as typeof fetch;
    expect(await createTurnstileVerifier({ secret: 's', fetchImpl })('token')).toBe(false);
  });

  it('sends the secret and token as a form body', async () => {
    const fetchImpl = answer({ success: true });
    await createTurnstileVerifier({ secret: 'the-secret', fetchImpl })('the-token');

    const init = vi.mocked(fetchImpl).mock.calls[0]?.[1];
    expect(init?.body).toBeInstanceOf(URLSearchParams);
    expect((init?.body as URLSearchParams).toString()).toBe('secret=the-secret&response=the-token');
  });

  it('is skipped without a secret (development only: production requires one)', async () => {
    const fetchImpl = answer({ success: false });
    expect(await createTurnstileVerifier({ secret: undefined, fetchImpl })('x')).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
