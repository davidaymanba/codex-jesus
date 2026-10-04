import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ERROR_CODES, Permission, type ApiError, type ApiSuccess } from '@codex/shared';

import { createApp } from '@/app.js';
import { createCache } from '@/lib/cache.js';
import { prisma } from '@/lib/prisma.js';
import { createRateLimiter } from '@/lib/rate-limiter.js';
import { createRedisClient } from '@/lib/redis.js';
import { requireAuth, requirePermission } from '@/modules/auth/auth.middleware.js';
import type { Readiness } from '@/modules/health/health.schemas.js';
import { sendSuccess } from '@/utils/response.js';

import { createUser, TEST_PASSWORD } from './database.js';
import { login } from './http.js';

// Test-only routes: an ADMIN-only endpoint and one that violates a unique constraint.
const probes = Router();
probes.get('/probe/users', requireAuth, requirePermission(Permission.USERS_MANAGE), (_req, res) => {
  sendSuccess(res, 'admin area');
});
probes.post('/probe/duplicate-user', async (_req, res) => {
  const data = { name: 'Dup', email: 'dup@codex.example', passwordHash: 'x' };
  await prisma.user.create({ data });
  await prisma.user.create({ data });
  sendSuccess(res, 'unreachable');
});
// Its own server (with probe routes), closed with the file's test environment.
const app = createApp({ routers: [probes] }).listen(0, '127.0.0.1');
const errorOf = (body: unknown) => (body as ApiError).error;

describe('RBAC', () => {
  it('denies an editor an admin-only route and allows an admin', async () => {
    const editor = await createUser({ role: 'EDITOR' });
    const admin = await createUser({ role: 'ADMIN' });
    const { jar: editorJar } = await login(editor.email, TEST_PASSWORD);
    const { jar: adminJar } = await login(admin.email, TEST_PASSWORD);

    const denied = await request(app).get('/api/v1/probe/users').set('Cookie', editorJar.header());
    const allowed = await request(app).get('/api/v1/probe/users').set('Cookie', adminJar.header());

    expect([denied.status, errorOf(denied.body).code]).toEqual([403, ERROR_CODES.FORBIDDEN]);
    expect(allowed.status).toBe(200);
  });
});

describe('database errors', () => {
  it('maps a unique violation (P2002) to 409', async () => {
    const response = await request(app).post('/api/v1/probe/duplicate-user').send({});
    expect([response.status, errorOf(response.body).code]).toEqual([409, ERROR_CODES.CONFLICT]);
  });

  it('keeps the audit log append-only for the app role', async () => {
    await prisma.auditLog.create({ data: { action: 'LOGIN', entity: 'USER' } });
    await expect(prisma.auditLog.deleteMany()).rejects.toThrow(/permission denied/);
    await expect(prisma.auditLog.updateMany({ data: { action: 'LOGOUT' } })).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe('GET /health/ready', () => {
  it('is ok when the database and Redis answer', async () => {
    const response = await request(app).get('/health/ready');
    expect(response.status).toBe(200);
    expect((response.body as ApiSuccess<Readiness>).data).toEqual({
      status: 'ok',
      checks: { database: 'ok', redis: 'ok' },
    });
  });
});

describe('Redis outage', () => {
  // Nothing listens on this port: the client never becomes ready.
  const deadRedis = createRedisClient('redis://127.0.0.1:6399');

  it('rate limits in memory instead of failing', async () => {
    const limiter = createRateLimiter({
      keyPrefix: 'outage',
      points: 1,
      durationSeconds: 60,
      client: deadRedis,
    });

    await expect(limiter.consume('client')).resolves.toMatchObject({ remainingPoints: 0 });
    await expect(limiter.consume('client')).rejects.toMatchObject({ remainingPoints: 0 });
  });

  it('serves from the loader instead of the cache', async () => {
    const cache = createCache(deadRedis);
    let loads = 0;
    const load = () => Promise.resolve(++loads);

    expect(await cache.wrap('key', { ttlSeconds: 60 }, load)).toBe(1);
    expect(await cache.wrap('key', { ttlSeconds: 60 }, load)).toBe(2);
  });
});
