import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { adminUserDtoSchema, ERROR_CODES, type ApiError } from '@codex/shared';

import type { EmailJob } from '@/lib/email/queue.js';
import { createUser, ownerDb, TEST_PASSWORD } from '@/test/integration/database.js';
import { adminCall, app, dataOf, login, ORIGIN, signInAs } from '@/test/integration/http.js';

const mocks = vi.hoisted(() => ({ jobs: [] as EmailJob[] }));
vi.mock('@/lib/email/queue.js', () => ({
  emailQueue: {
    enqueue: (job: EmailJob) => {
      mocks.jobs.push(job);
    },
  },
}));

const errorOf = (body: unknown) => (body as ApiError).error;
const NEW_PASSWORD = 'Velvet-Compass-Orchard-58';

describe('admin users', () => {
  it('is ADMIN only', async () => {
    const editor = await signInAs('EDITOR');
    const response = await adminCall('get', '/admin/users', editor);
    expect([response.status, errorOf(response.body).code]).toEqual([403, ERROR_CODES.FORBIDDEN]);
  });

  it('creates users with a strong password and never returns secrets', async () => {
    const admin = await signInAs();
    const weak = await adminCall('post', '/admin/users', admin).send({
      name: 'New Editor',
      email: 'new.editor@codex.example',
      password: 'Password12345',
    });
    const created = await adminCall('post', '/admin/users', admin).send({
      name: 'New Editor',
      email: 'new.editor@codex.example',
      password: NEW_PASSWORD,
    });

    expect(weak.status).toBe(400);
    expect(dataOf(created, adminUserDtoSchema)).toMatchObject({ role: 'EDITOR', isActive: true });
    expect(created.text).not.toMatch(/password|argon2/i);
    const audit = await ownerDb.auditLog.findFirstOrThrow({
      where: { action: 'CREATE', entity: 'USER' },
    });
    expect(JSON.stringify(audit.changes)).not.toContain(NEW_PASSWORD);
  });

  it('never demotes or deactivates the last active admin', async () => {
    const admin = await createUser({ role: 'ADMIN', email: 'only.admin@codex.example' });
    const { jar } = await login(admin.email, TEST_PASSWORD);

    const demote = await adminCall('patch', `/admin/users/${admin.id}`, jar).send({
      role: 'EDITOR',
    });
    const deactivate = await adminCall('patch', `/admin/users/${admin.id}`, jar).send({
      isActive: false,
    });

    expect([demote.status, errorOf(demote.body).details]).toEqual([
      409,
      [{ path: 'role', message: 'validation.user.lastAdmin' }],
    ]);
    expect(deactivate.status).toBe(409);
  });

  it('deactivation ends the user’s sessions immediately', async () => {
    const admin = await signInAs();
    const editor = await createUser({ role: 'EDITOR', email: 'leaving@codex.example' });
    const { jar: editorJar } = await login(editor.email, TEST_PASSWORD);
    const me = () => request(app).get('/api/v1/auth/me').set('Cookie', editorJar.header());
    expect((await me()).status).toBe(200);

    await adminCall('patch', `/admin/users/${editor.id}`, admin).send({ isActive: false });

    expect((await me()).status).toBe(401);
    expect(
      await ownerDb.refreshToken.count({ where: { userId: editor.id, revokedAt: null } }),
    ).toBe(0);
  });
});

describe('password reset', () => {
  async function requestLink() {
    mocks.jobs = [];
    const admin = await signInAs();
    const editor = await createUser({ role: 'EDITOR', email: 'forgetful@codex.example' });
    const { jar: oldSession } = await login(editor.email, TEST_PASSWORD);
    const response = await adminCall('post', `/admin/users/${editor.id}/reset-password`, admin);
    const email = await mocks.jobs[0]?.build();
    const token = new URL(
      /href="([^"]+reset-password[^"]+)"/.exec(email?.html ?? '')?.[1]?.replaceAll('&amp;', '&') ??
        'http://x',
    ).searchParams.get('token');
    return { response, email, token, editor, oldSession };
  }

  const confirm = (body: object) =>
    request(app).post('/api/v1/auth/password-reset').set('Origin', ORIGIN).send(body);

  it('emails a single-use link that sets a new password and ends old sessions', async () => {
    const { response, email, token, editor, oldSession } = await requestLink();
    expect(response.status).toBe(204);
    expect(email?.to).toBe('forgetful@codex.example');
    expect(token).toMatch(/^[\w-]{40,}$/);

    expect((await confirm({ token, newPassword: NEW_PASSWORD })).status).toBe(204);
    expect((await confirm({ token, newPassword: NEW_PASSWORD })).status).toBe(400);

    expect(
      (await request(app).get('/api/v1/auth/me').set('Cookie', oldSession.header())).status,
    ).toBe(401);
    expect((await login(editor.email, TEST_PASSWORD)).response.status).toBe(401);
    expect((await login(editor.email, NEW_PASSWORD)).response.status).toBe(200);
    const stored = await ownerDb.passwordResetToken.findFirstOrThrow();
    expect(stored.tokenHash).not.toBe(token);
  });

  it('rejects expired tokens and guessable passwords', async () => {
    const { token } = await requestLink();
    expect((await confirm({ token, newPassword: 'Password12345' })).status).toBe(400);

    await ownerDb.passwordResetToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expired = await confirm({ token, newPassword: NEW_PASSWORD });
    expect(errorOf(expired.body).details).toEqual([
      { path: 'token', message: 'validation.token.invalid' },
    ]);
  });
});
