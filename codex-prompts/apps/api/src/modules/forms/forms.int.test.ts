import { Writable } from 'node:stream';

import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ERROR_CODES, FORM_RATE_LIMIT, type ApiError } from '@codex/shared';

import type { EmailJob } from '@/lib/email/queue.js';
import type * as LoggerModule from '@/lib/logger.js';
import { ownerDb } from '@/test/integration/database.js';
import { app, ORIGIN } from '@/test/integration/http.js';

const mocks = vi.hoisted(() => ({
  jobs: [] as EmailJob[],
  isHuman: true,
  logLines: [] as string[],
}));

// Never call Cloudflare from tests: the verifier answers what the test decides.
vi.mock('@/lib/turnstile.js', () => ({
  verifyTurnstile: () => Promise.resolve(mocks.isHuman),
}));
vi.mock('@/lib/email/queue.js', () => ({
  emailQueue: {
    enqueue: (job: EmailJob) => {
      mocks.jobs.push(job);
    },
  },
}));
vi.mock('@/lib/logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LoggerModule>();
  const sink = new Writable({
    write(chunk: Buffer, _encoding, done) {
      mocks.logLines.push(chunk.toString());
      done();
    },
  });
  return { ...actual, logger: actual.createLogger(sink, 'info') };
});

const errorOf = (body: unknown) => (body as ApiError).error;
const PRIVATE = {
  name: 'Private Person',
  email: 'private.person@client.example',
  phone: '+966512345678',
};

const contact = (overrides: Record<string, unknown> = {}) =>
  request(app)
    .post('/api/v1/public/contact')
    .set('Origin', ORIGIN)
    .send({
      ...PRIVATE,
      message: 'We need a new online store for our brand.',
      locale: 'en',
      turnstileToken: 'token',
      ...overrides,
    });

const quote = () =>
  request(app)
    .post('/api/v1/public/quote')
    .set('Origin', ORIGIN)
    .send({
      ...PRIVATE,
      services: ['ECOMMERCE', 'SALLA'],
      projectDetails: 'A Salla store with inventory sync and a custom theme.',
      budgetRange: 'FROM_5K_TO_15K',
      timeline: 'ASAP',
      locale: 'ar',
      turnstileToken: 'token',
    });

beforeEach(() => {
  mocks.jobs = [];
  mocks.isHuman = true;
  mocks.logLines = [];
});

describe('public forms', () => {
  it('saves a quote with ipHash and locale, answers minimally and queues two emails', async () => {
    const response = await quote();

    expect([response.status, response.body]).toEqual([
      201,
      { success: true, data: { received: true } },
    ]);
    const saved = await ownerDb.quoteRequest.findFirstOrThrow();
    expect(saved).toMatchObject({ locale: 'ar', status: 'NEW', email: PRIVATE.email });
    expect(saved.ipHash).toMatch(/^[0-9a-f]{64}$/);

    const emails = await Promise.all(mocks.jobs.map((job) => job.build()));
    expect(mocks.jobs.map((job) => job.name)).toEqual(['quote-notification', 'quote-confirmation']);
    expect(emails[0]).toMatchObject({ to: 'leads@codex.local', replyTo: PRIVATE.email });
    expect(emails[0]?.html).toContain(`/admin/quotes/${saved.id}`);
    expect(emails[1]?.to).toBe(PRIVATE.email);
    expect(emails[1]?.subject).toContain('استلمنا');
  });

  it('accepts but discards a filled honeypot', async () => {
    const response = await contact({ website: 'https://spam.example' });

    expect(response.status).toBe(201);
    expect(await ownerDb.contactMessage.count()).toBe(0);
    expect(mocks.jobs).toHaveLength(0);
  });

  it('rejects a failed bot check before validating anything', async () => {
    mocks.isHuman = false;
    const response = await contact({ email: 'not-an-email' });

    expect([response.status, errorOf(response.body).code]).toEqual([
      403,
      ERROR_CODES.BOT_CHECK_FAILED,
    ]);
    expect((await contact({ turnstileToken: undefined })).status).toBe(403);
  });

  it('validates with the shared schema (i18n keys)', async () => {
    const response = await contact({ message: 'short' });
    expect(errorOf(response.body).details).toEqual([
      { path: 'message', message: 'validation.tooShort' },
    ]);
  });

  it(`allows ${FORM_RATE_LIMIT.POINTS} submissions per hour per IP`, async () => {
    for (let index = 0; index < FORM_RATE_LIMIT.POINTS; index += 1) {
      expect((await contact()).status).toBe(201);
    }
    const blocked = await contact();
    expect([blocked.status, errorOf(blocked.body).code]).toEqual([429, ERROR_CODES.RATE_LIMITED]);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('logs the submission without any PII', async () => {
    await contact();
    const log = mocks.logLines.join('');

    expect(log).toContain('POST /api/v1/public/contact 201');
    for (const value of Object.values(PRIVATE)) expect(log).not.toContain(value);
  });
});
