import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { INTERNAL_API_HEADER } from '@codex/shared';

import { createApiClient } from './create-client';
import { ApiClientError } from './errors';

const TOKEN = 'internal-token-0123456789abcdef0123456789';

function fakeFetch(respond: () => Promise<Response>) {
  const calls: { url: string; init: RequestInit & { next?: unknown } }[] = [];
  const fetchImpl = vi.fn((url: URL | string, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return respond();
  });
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch };
}

const json = (body: unknown, status = 200) => Promise.resolve(Response.json(body, { status }));
const schema = z.object({ name: z.string() });

describe('apiFetch', () => {
  it('returns data, sends the internal token and caches under the given tags', async () => {
    const { calls, fetchImpl } = fakeFetch(() => json({ success: true, data: { name: 'Codex' } }));
    const apiFetch = createApiClient({
      baseUrl: 'http://api.test',
      internalToken: TOKEN,
      shouldValidate: true,
      fetchImpl,
    });

    const result = await apiFetch({
      path: '/public/settings',
      query: { pageSize: 50, featured: undefined },
      schema,
      tags: ['settings'],
    });

    expect(result).toEqual({ data: { name: 'Codex' } });
    const [call] = calls;
    expect(call?.url).toBe('http://api.test/api/v1/public/settings?pageSize=50');
    expect(call?.init.headers).toMatchObject({ [INTERNAL_API_HEADER]: TOKEN });
    expect(call?.init.next).toEqual({ tags: ['settings'], revalidate: 3600 });
  });

  it('turns an API error into an ApiClientError with status and code', async () => {
    const { fetchImpl } = fakeFetch(() =>
      json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'errors.notFound', requestId: 'r' },
        },
        404,
      ),
    );
    const apiFetch = createApiClient({
      baseUrl: 'http://api.test',
      internalToken: undefined,
      shouldValidate: true,
      fetchImpl,
    });

    const failure = await apiFetch({ path: '/public/x', schema, tags: [] }).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(ApiClientError);
    expect(failure).toMatchObject({
      kind: 'http',
      status: 404,
      code: 'NOT_FOUND',
      isNotFound: true,
    });
  });

  it('gives up after the timeout', async () => {
    const { fetchImpl } = fakeFetch(() =>
      Promise.reject(new DOMException('The operation timed out.', 'TimeoutError')),
    );
    const apiFetch = createApiClient({
      baseUrl: 'http://api.test',
      internalToken: undefined,
      shouldValidate: true,
      fetchImpl,
    });

    await expect(
      apiFetch({ path: '/public/x', schema, tags: [], timeoutMs: 1 }),
    ).rejects.toMatchObject({
      kind: 'timeout',
    });
  });

  it('rejects a response that breaks the contract when validating', async () => {
    const { fetchImpl } = fakeFetch(() => json({ success: true, data: { name: 42 } }));
    const apiFetch = createApiClient({
      baseUrl: 'http://api.test',
      internalToken: undefined,
      shouldValidate: true,
      fetchImpl,
    });

    await expect(apiFetch({ path: '/public/x', schema, tags: [] })).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });
});
