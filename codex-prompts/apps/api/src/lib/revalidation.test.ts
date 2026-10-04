import { describe, expect, it, vi } from 'vitest';

import { REVALIDATION, verifyRevalidation } from '@codex/shared';

import { createRevalidator } from './revalidation.js';

const SECRET = 'revalidation-test-secret-0123456789abcdef';
const URL = 'http://web.test/api/revalidate';

function recordingFetch(statuses: number[]) {
  const calls: { headers: Record<string, string>; body: string }[] = [];
  const fetchImpl = vi.fn((_url: unknown, init?: RequestInit) => {
    const body = typeof init?.body === 'string' ? init.body : '';
    calls.push({ headers: init?.headers as Record<string, string>, body });
    return Promise.resolve(new Response(null, { status: statuses.shift() ?? 200 }));
  });
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch };
}

describe('revalidator', () => {
  it('merges tags from close writes into one request the web app can verify', async () => {
    const { calls, fetchImpl } = recordingFetch([200]);
    const revalidator = createRevalidator({ url: URL, secret: SECRET, fetchImpl, coalesceMs: 5 });

    revalidator.revalidate(['posts', 'posts:1']);
    revalidator.revalidate(['posts', 'sitemap']);
    await revalidator.flush();

    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(JSON.parse(call?.body ?? '')).toEqual({ tags: ['posts', 'posts:1', 'sitemap'] });
    const isValid = await verifyRevalidation({
      secret: SECRET,
      timestamp: call?.headers[REVALIDATION.TIMESTAMP_HEADER] ?? null,
      signature: call?.headers[REVALIDATION.SIGNATURE_HEADER] ?? null,
      body: call?.body ?? '',
    });
    expect(isValid).toBe(true);
  });

  it('splits more tags than one request may carry over several requests', async () => {
    const { calls, fetchImpl } = recordingFetch([]);
    const revalidator = createRevalidator({ url: URL, secret: SECRET, fetchImpl, coalesceMs: 1 });
    const tags = Array.from({ length: REVALIDATION.MAX_TAGS + 5 }, (_, index) => `posts:${index}`);

    revalidator.revalidate(tags);
    await revalidator.flush();

    const sent = calls.map(({ body }) => (JSON.parse(body) as { tags: string[] }).tags);
    expect(sent.map((batch) => batch.length)).toEqual([REVALIDATION.MAX_TAGS, 5]);
    expect(sent.flat()).toEqual(tags);
  });

  it('retries failures, then gives up without throwing', async () => {
    const { calls, fetchImpl } = recordingFetch([500, 502, 503]);
    const revalidator = createRevalidator({
      url: URL,
      secret: SECRET,
      fetchImpl,
      coalesceMs: 1,
      retryDelaysMs: [1, 1],
    });

    revalidator.revalidate(['services']);
    await revalidator.flush();
    expect(calls).toHaveLength(3);
  });

  it('does nothing without a secret', async () => {
    const { calls, fetchImpl } = recordingFetch([]);
    const revalidator = createRevalidator({ url: URL, secret: undefined, fetchImpl });

    revalidator.revalidate(['posts']);
    await revalidator.flush();
    expect(calls).toHaveLength(0);
  });
});
