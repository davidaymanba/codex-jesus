import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { AUTH_TOKEN_TTL, ERROR_CODES, type ApiError } from '@codex/shared';

import { REFRESH_REUSE_GRACE_MS } from '@/config/constants.js';
import { createUser, ownerDb } from '@/test/integration/database.js';
import { app, type CookieJar, login, post } from '@/test/integration/http.js';

const REFRESH = '/api/v1/auth/refresh';
const errorOf = (body: unknown) => (body as ApiError).error;

async function signedIn() {
  const user = await createUser();
  const { jar } = await login(user.email, user.password);
  return { user, jar };
}

async function refresh(jar: CookieJar, csrf?: string) {
  const response = await post(REFRESH, jar, csrf);
  jar.store(response);
  return response;
}

/** Moves every revocation back in time, past the two-tab grace window. */
async function ageRevocations(): Promise<void> {
  const past = new Date(Date.now() - REFRESH_REUSE_GRACE_MS * 2);
  await ownerDb.refreshToken.updateMany({
    where: { revokedAt: { not: null } },
    data: { revokedAt: past },
  });
}

describe('POST /auth/refresh', () => {
  it('rotates the refresh token and links the old one to its replacement', async () => {
    const { jar } = await signedIn();
    const before = jar.get('codex_rt');

    const response = await refresh(jar);

    expect(response.status).toBe(200);
    expect(jar.get('codex_rt')).not.toBe(before);
    const tokens = await ownerDb.refreshToken.findMany({ orderBy: { createdAt: 'asc' } });
    expect(tokens).toHaveLength(2);
    expect(tokens[0]?.revokedAt).not.toBeNull();
    expect(tokens[0]?.replacedById).toBe(tokens[1]?.id);
    expect(tokens[1]?.familyId).toBe(tokens[0]?.familyId);
  });

  it('revokes the whole family when a rotated token is reused', async () => {
    const { user, jar } = await signedIn();
    const stolen = jar.clone();
    await refresh(jar);
    await ageRevocations();

    const reuse = await refresh(stolen, jar.get('codex_csrf'));
    expect(reuse.status).toBe(401);

    const active = await ownerDb.refreshToken.count({ where: { revokedAt: null } });
    expect(active).toBe(0);
    expect((await refresh(jar)).status).toBe(401);
    // Logged once: the newest token was revoked with its session, not reused.
    const audits = await ownerDb.auditLog.findMany({ where: { action: 'TOKEN_REUSE_DETECTED' } });
    expect(audits.map((audit) => audit.actorId)).toEqual([user.id]);
  });

  it('tolerates two tabs refreshing at once (grace window) without ending the session', async () => {
    const { jar } = await signedIn();
    const otherTab = jar.clone();
    await refresh(jar);

    const late = await post(REFRESH, otherTab, jar.get('codex_csrf'));
    // 409, and no Set-Cookie: clearing cookies here would log out the tab that won.
    expect([late.status, errorOf(late.body).code]).toEqual([409, ERROR_CODES.REFRESH_CONFLICT]);
    expect(late.headers['set-cookie']).toBeUndefined();
    expect((await refresh(jar)).status).toBe(200);
    expect(await ownerDb.auditLog.count({ where: { action: 'TOKEN_REUSE_DETECTED' } })).toBe(0);
  });

  it('does not report reuse for a token whose session already ended', async () => {
    const { jar } = await signedIn();
    const stale = jar.clone();
    await post('/api/v1/auth/logout', jar);
    await ageRevocations();

    expect((await refresh(stale)).status).toBe(401);
    expect(await ownerDb.auditLog.count({ where: { action: 'TOKEN_REUSE_DETECTED' } })).toBe(0);
  });

  it('requires the CSRF header matching the session', async () => {
    const { jar } = await signedIn();

    const missing = await post(REFRESH, jar, '');
    expect([missing.status, errorOf(missing.body).code]).toEqual([403, ERROR_CODES.CSRF_INVALID]);

    const forged = await post(REFRESH, jar, 'nonce.signature');
    expect(forged.status).toBe(403);
  });

  it('ends the session at the 30-day cap even after its first token was deleted', async () => {
    const { jar } = await signedIn();
    await refresh(jar);
    const first = await ownerDb.refreshToken.findFirstOrThrow({ orderBy: { createdAt: 'asc' } });
    // Login housekeeping deletes expired tokens, including a live family's oldest ones.
    await ownerDb.refreshToken.delete({ where: { id: first.id } });
    const startedLongAgo = new Date(Date.now() - (AUTH_TOKEN_TTL.SESSION_MAX_SECONDS + 60) * 1000);
    await ownerDb.refreshToken.updateMany({ data: { sessionStartedAt: startedLongAgo } });

    expect((await refresh(jar)).status).toBe(401);
    expect(await ownerDb.refreshToken.count({ where: { revokedAt: null } })).toBe(0);
  });

  it('rejects an expired refresh token and clears the cookies', async () => {
    const { jar } = await signedIn();
    await ownerDb.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const response = await refresh(jar);
    expect(response.status).toBe(401);
    expect(jar.get('codex_rt')).toBeUndefined();
  });
});

describe('POST /auth/logout', () => {
  it('revokes the session and clears the cookies', async () => {
    const { jar } = await signedIn();
    const stale = jar.clone();

    const response = await post('/api/v1/auth/logout', jar);
    jar.store(response);

    expect(response.status).toBe(204);
    expect(jar.get('codex_at')).toBeUndefined();
    expect(await ownerDb.refreshToken.count({ where: { revokedAt: null } })).toBe(0);
    expect((await refresh(stale)).status).toBe(401);
  });

  it('ends access immediately: the old access token stops working', async () => {
    const { jar } = await signedIn();
    const stale = jar.clone();
    const me = () => request(app).get('/api/v1/auth/me').set('Cookie', stale.header());
    expect((await me()).status).toBe(200);

    await post('/api/v1/auth/logout', jar);

    expect((await me()).status).toBe(401);
  });
});

describe('POST /auth/change-password', () => {
  const NEW_PASSWORD = 'Quiet-Harbor-Maple-92';

  it('changes the password, ends other sessions and keeps this one', async () => {
    const { user, jar } = await signedIn();
    const { jar: otherDevice } = await login(user.email, user.password);
    const oldAccess = jar.clone();

    const response = await post('/api/v1/auth/change-password', jar).send({
      currentPassword: user.password,
      newPassword: NEW_PASSWORD,
    });
    jar.store(response);

    expect(response.status).toBe(204);
    expect((await request(app).get('/api/v1/auth/me').set('Cookie', jar.header())).status).toBe(
      200,
    );
    expect(
      (await request(app).get('/api/v1/auth/me').set('Cookie', oldAccess.header())).status,
    ).toBe(401);
    expect((await refresh(otherDevice)).status).toBe(401);
    expect((await login(user.email, NEW_PASSWORD)).response.status).toBe(200);
  });

  it('rejects a wrong current password, a guessable new one and a missing CSRF token', async () => {
    const { user, jar } = await signedIn();
    const path = '/api/v1/auth/change-password';

    const wrong = await post(path, jar).send({
      currentPassword: 'nope',
      newPassword: NEW_PASSWORD,
    });
    expect(errorOf(wrong.body).code).toBe(ERROR_CODES.INVALID_CREDENTIALS);

    const weak = await post(path, jar).send({
      currentPassword: user.password,
      newPassword: 'Password1234!',
    });
    expect([weak.status, errorOf(weak.body).details]).toEqual([
      400,
      [{ path: 'newPassword', message: 'validation.password.weak' }],
    ]);

    const noCsrf = await post(path, jar, '').send({
      currentPassword: user.password,
      newPassword: NEW_PASSWORD,
    });
    expect([noCsrf.status, errorOf(noCsrf.body).code]).toEqual([403, ERROR_CODES.CSRF_INVALID]);
  });

  it('refuses to check the current password while the account is locked', async () => {
    const { user, jar } = await signedIn();
    await ownerDb.user.update({
      where: { id: user.id },
      data: { lockedUntil: new Date(Date.now() + 60_000) },
    });

    const response = await post('/api/v1/auth/change-password', jar).send({
      currentPassword: user.password,
      newPassword: NEW_PASSWORD,
    });

    expect([response.status, errorOf(response.body).code]).toEqual([429, ERROR_CODES.RATE_LIMITED]);
  });
});
