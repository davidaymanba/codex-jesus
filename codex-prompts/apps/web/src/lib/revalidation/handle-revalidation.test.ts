import { describe, expect, it, vi } from 'vitest';

import { REVALIDATION, signRevalidation } from '@codex/shared';

import { handleRevalidation } from './handle-revalidation';

const SECRET = 'revalidation-secret-0123456789abcdef0123';
const NOW = new Date('2026-10-01T12:00:00Z');
const nowSeconds = () => String(Math.floor(NOW.getTime() / 1000));

async function signedRequest(
  body: string,
  { secret = SECRET, timestamp = nowSeconds() }: { secret?: string; timestamp?: string } = {},
) {
  return new Request('http://web.test/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [REVALIDATION.TIMESTAMP_HEADER]: timestamp,
      [REVALIDATION.SIGNATURE_HEADER]: await signRevalidation(secret, timestamp, body),
    },
    body,
  });
}

async function run(request: Request) {
  const revalidate = vi.fn();
  const response = await handleRevalidation(request, { secret: SECRET, revalidate, now: NOW });
  return { status: response.status, body: (await response.json()) as unknown, revalidate };
}

describe('revalidation webhook', () => {
  it('revalidates each tag of a correctly signed, fresh request once', async () => {
    const result = await run(await signedRequest('{"tags":["posts","posts:1","posts"]}'));

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ revalidated: 2 });
    expect(result.revalidate.mock.calls).toEqual([['posts'], ['posts:1']]);
  });

  it('rejects a signature made with another secret', async () => {
    const result = await run(await signedRequest('{"tags":["posts"]}', { secret: `${SECRET}x` }));
    expect(result.status).toBe(401);
    expect(result.revalidate).not.toHaveBeenCalled();
  });

  it('rejects a body changed after signing', async () => {
    const request = await signedRequest('{"tags":["posts"]}');
    const tampered = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: '{"tags":["settings"]}',
    });

    const result = await run(tampered);
    expect(result.status).toBe(401);
    expect(result.revalidate).not.toHaveBeenCalled();
  });

  it('rejects a replay older than five minutes', async () => {
    const stale = String(Number(nowSeconds()) - REVALIDATION.MAX_AGE_SECONDS - 1);
    const result = await run(await signedRequest('{"tags":["posts"]}', { timestamp: stale }));
    expect(result.status).toBe(401);
  });

  it('rejects missing signature headers', async () => {
    const request = new Request('http://web.test/api/revalidate', {
      method: 'POST',
      body: '{"tags":["posts"]}',
    });
    expect((await run(request)).status).toBe(401);
  });

  it('rejects a signed body that is not a tag list', async () => {
    for (const body of [
      'not json',
      '{"tags":[]}',
      '{"tags":["posts"],"extra":1}',
      '{"tags":[1]}',
    ]) {
      const result = await run(await signedRequest(body));
      expect([body, result.status]).toEqual([body, 400]);
    }
  });

  it('refuses oversized bodies before verifying them', async () => {
    const tags = Array.from({ length: REVALIDATION.MAX_TAGS * 2 }, () =>
      'x'.repeat(REVALIDATION.TAG_MAX_LENGTH),
    );
    const result = await run(await signedRequest(JSON.stringify({ tags })));
    expect(result.status).toBe(413);
  });

  it('stops reading a chunked body without Content-Length once it is too large', async () => {
    let pulls = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new Uint8Array(64 * 1024));
      },
    });
    const request = new Request('http://web.test/api/revalidate', {
      method: 'POST',
      body: endless,
      duplex: 'half',
    } as RequestInit);

    expect((await run(request)).status).toBe(413);
    expect(pulls).toBeLessThan(5);
  });

  it('is disabled without a secret', async () => {
    const response = await handleRevalidation(await signedRequest('{"tags":["posts"]}'), {
      secret: undefined,
      revalidate: vi.fn(),
      now: NOW,
    });
    expect(response.status).toBe(503);
  });
});
