import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ERROR_CODES, type ApiError, type ApiSuccess, type AuthUser } from '@codex/shared';

import { LOGIN_LOCKOUT, RATE_LIMITS } from '@/config/constants.js';
import { createUser, ownerDb } from '@/test/integration/database.js';
import { app, login, setCookieLine } from '@/test/integration/http.js';

const errorOf = (body: unknown) => (body as ApiError).error;

async function median(samples: number, run: () => Promise<unknown>): Promise<number> {
  const durations: number[] = [];
  for (let index = 0; index < samples; index += 1) {
    const start = performance.now();
    await run();
    durations.push(performance.now() - start);
  }
  return durations.sort((a, b) => a - b)[Math.floor(samples / 2)] ?? 0;
}

describe('POST /auth/login', () => {
  it('signs in, sets hardened cookies and returns safe fields only', async () => {
    const user = await createUser();
    const { response } = await login(user.email, user.password);

    expect(response.status).toBe(200);
    expect((response.body as ApiSuccess<{ user: AuthUser }>).data.user).toEqual({
      id: user.id,
      name: 'Test User',
      email: user.email,
      role: 'ADMIN',
      lastLoginAt: expect.any(String) as string,
    });
    expect(response.text).not.toMatch(/passwordHash|argon2/);
    expect(setCookieLine(response, 'codex_at')).toMatch(/Path=\/;.*HttpOnly/);
    expect(setCookieLine(response, 'codex_rt')).toMatch(/Path=\/api\/v1\/auth;.*HttpOnly/);
    expect(setCookieLine(response, 'codex_csrf')).not.toMatch(/HttpOnly/);
    for (const name of ['codex_at', 'codex_rt', 'codex_csrf']) {
      expect(setCookieLine(response, name)).toContain('SameSite=Lax');
    }
  });

  it('answers a wrong password and an unknown account identically', async () => {
    const user = await createUser();
    const wrong = await login(user.email, 'Wrong-Password-1');
    const unknown = await login('nobody@codex.example', 'Wrong-Password-1');

    expect([wrong.response.status, unknown.response.status]).toEqual([401, 401]);
    const { requestId: _wrongId, ...wrongError } = errorOf(wrong.response.body);
    const { requestId: _unknownId, ...unknownError } = errorOf(unknown.response.body);
    expect(wrongError).toEqual(unknownError);
    expect(wrongError.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
  });

  it('takes as long for an unknown account as for a wrong password (argon2 either way)', async () => {
    const user = await createUser();
    const wrong = await median(3, () => login(user.email, 'Wrong-Password-1'));
    const unknown = await median(3, () => login('nobody@codex.example', 'Wrong-Password-1'));

    expect(unknown).toBeGreaterThan(wrong * 0.5);
  });

  it('locks the account after 5 wrong passwords, even for the right one', async () => {
    const user = await createUser();
    for (let attempt = 0; attempt < LOGIN_LOCKOUT.MAX_FAILED_ATTEMPTS; attempt += 1) {
      expect((await login(user.email, 'Wrong-Password-1')).response.status).toBe(401);
    }
    const stored = await ownerDb.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.lockedUntil?.getTime()).toBeGreaterThan(Date.now());

    const locked = await login(user.email, user.password);
    expect(locked.response.status).toBe(429);
    expect(errorOf(locked.response.body).code).toBe(ERROR_CODES.RATE_LIMITED);
    expect(Number(locked.response.headers['retry-after'])).toBeGreaterThan(0);

    const actions = await ownerDb.auditLog.findMany({ select: { action: true } });
    expect(actions.map(({ action }) => action)).toContain('ACCOUNT_LOCKED');
  });

  it('throttles repeated failures per email, whether or not the account exists', async () => {
    for (let attempt = 0; attempt < RATE_LIMITS.LOGIN_PER_EMAIL.points; attempt += 1) {
      await login('ghost@codex.example', 'Wrong-Password-1');
    }
    expect((await login('ghost@codex.example', 'Wrong-Password-1')).response.status).toBe(429);
  });

  it('rejects a foreign Origin before touching credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'x@codex.example', password: 'x' });

    expect(response.status).toBe(403);
    expect(errorOf(response.body).code).toBe(ERROR_CODES.CSRF_INVALID);
  });

  it('refuses inactive accounts with the generic answer', async () => {
    const user = await createUser({ isActive: false });
    const { response } = await login(user.email, user.password);

    expect(response.status).toBe(401);
    expect(errorOf(response.body).code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
  });

  it('audits successful and failed logins without storing raw IPs', async () => {
    const user = await createUser();
    await login(user.email, 'Wrong-Password-1');
    await login(user.email, user.password);

    const entries = await ownerDb.auditLog.findMany({ orderBy: { createdAt: 'asc' } });
    expect(entries.map(({ action }) => action)).toEqual(['LOGIN_FAILED', 'LOGIN']);
    for (const entry of entries) expect(entry.ipHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('GET /auth/me', () => {
  it('is 401 without a token', async () => {
    const response = await request(app).get('/api/v1/auth/me');
    expect(response.status).toBe(401);
    expect(errorOf(response.body).code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it('returns the signed-in user', async () => {
    const user = await createUser();
    const { jar } = await login(user.email, user.password);
    const response = await request(app).get('/api/v1/auth/me').set('Cookie', jar.header());

    expect(response.status).toBe(200);
    expect((response.body as ApiSuccess<{ user: AuthUser }>).data.user.id).toBe(user.id);
  });

  it('rejects a forged token and a deactivated user', async () => {
    const user = await createUser();
    const { jar } = await login(user.email, user.password);
    const forged = `${jar.get('codex_at') ?? ''}x`;
    expect(
      (await request(app).get('/api/v1/auth/me').set('Cookie', `codex_at=${forged}`)).status,
    ).toBe(401);

    await ownerDb.user.update({ where: { id: user.id }, data: { isActive: false } });
    expect((await request(app).get('/api/v1/auth/me').set('Cookie', jar.header())).status).toBe(
      401,
    );
  });
});
