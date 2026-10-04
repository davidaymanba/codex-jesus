import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ERROR_CODES, type ApiError } from '@codex/shared';

import { productionEnvOverrides } from '@/test/test-env.js';

describe('error responses in production mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('contain no stack trace, message or path of an unexpected error', async () => {
    vi.resetModules();
    // Required in production; nothing is contacted in this test.
    for (const [key, value] of Object.entries(productionEnvOverrides())) vi.stubEnv(key, value);
    const [{ createApp }, { Router }] = await Promise.all([import('@/app.js'), import('express')]);

    const crash = Router().get('/probe/crash', () => {
      throw new TypeError('Cannot read properties of undefined at /srv/app/dist/server.js:42');
    });
    const response = await request(createApp({ routers: [crash] })).get('/api/v1/probe/crash');

    expect(response.status).toBe(500);
    expect((response.body as ApiError).error).toEqual({
      code: ERROR_CODES.INTERNAL,
      message: 'errors.internal',
      requestId: expect.any(String) as string,
    });
    expect(response.text).not.toMatch(/TypeError|server\.js|\bat \//);
  });
});
