import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ERROR_CODES, INTERNAL_API_HEADER, type ApiError } from '@codex/shared';

import { RATE_LIMITS } from '@/config/constants.js';
import { createUser } from '@/test/integration/database.js';
import { app, login, ORIGIN } from '@/test/integration/http.js';
import { TEST_INTERNAL_API_TOKEN } from '@/test/test-env.js';

const errorOf = (body: unknown) => (body as ApiError).error;

describe('traffic limits', () => {
  it('gives the web server (valid internal token) its own bucket', async () => {
    const browser = await request(app).get('/api/v1/public/nothing');
    const server = await request(app)
      .get('/api/v1/public/nothing')
      .set(INTERNAL_API_HEADER, TEST_INTERNAL_API_TOKEN);
    const forged = await request(app)
      .get('/api/v1/public/nothing')
      .set(INTERNAL_API_HEADER, 'not-the-token');

    expect(browser.headers['ratelimit-limit']).toBe(String(RATE_LIMITS.GLOBAL.points));
    expect(server.headers['ratelimit-limit']).toBe(String(RATE_LIMITS.INTERNAL.points));
    expect(forged.headers['ratelimit-limit']).toBe(String(RATE_LIMITS.GLOBAL.points));
  });

  it('marks public reads as cacheable with revalidation', async () => {
    const response = await request(app).get('/api/v1/public/nothing');
    expect(response.headers['cache-control']).toBe('public, no-cache');
  });
});

describe('admin gate', () => {
  it('denies anonymous requests to any admin path, even unknown ones', async () => {
    const response = await request(app).get('/api/v1/admin/anything');
    expect([response.status, errorOf(response.body).code]).toEqual([401, ERROR_CODES.UNAUTHORIZED]);
  });

  it('charges requests without a session to the client IP', async () => {
    const anonymous = () => request(app).get('/api/v1/admin/posts');
    for (let sent = 0; sent < RATE_LIMITS.GLOBAL.points; sent += 1) {
      expect((await anonymous()).status).toBe(401);
    }

    const throttled = await anonymous();
    expect([throttled.status, errorOf(throttled.body).code]).toEqual([
      429,
      ERROR_CODES.RATE_LIMITED,
    ]);
  });

  it('limits signed-in admins per user and requires CSRF on writes', async () => {
    const user = await createUser();
    const { jar } = await login(user.email, user.password);

    const read = await request(app).get('/api/v1/admin/anything').set('Cookie', jar.header());
    const write = await request(app)
      .post('/api/v1/admin/anything')
      .set('Origin', ORIGIN)
      .set('Cookie', jar.header());

    expect(read.status).toBe(404);
    expect(read.headers['ratelimit-limit']).toBe(String(RATE_LIMITS.ADMIN_PER_USER.points));
    expect([write.status, errorOf(write.body).code]).toEqual([403, ERROR_CODES.CSRF_INVALID]);
  });
});
