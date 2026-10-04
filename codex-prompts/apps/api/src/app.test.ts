import { Router } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { ERROR_CODES, loginSchema, type ApiError, type ApiSuccess } from '@codex/shared';

import { createApp } from '@/app.js';
import { rateLimit } from '@/middleware/rate-limit.js';
import { validate } from '@/middleware/validate.js';
import { sendSuccess } from '@/utils/response.js';

const ORIGIN = 'http://localhost:3000';

const probe = Router();
probe.post('/probe/validate', validate({ body: loginSchema }), (req, res) => {
  sendSuccess(res, req.body);
});
probe.get('/probe/crash', () => {
  throw new Error('db password is hunter2 at /srv/app/secret.ts');
});
probe.get('/probe/half-sent', (_req, res) => {
  res.status(200).write('partial');
  throw new Error('the export source failed');
});
probe.get(
  '/probe/limited',
  rateLimit(new RateLimiterMemory({ keyPrefix: 'probe', points: 1, duration: 60 })),
  (_req, res) => {
    sendSuccess(res, 'ok');
  },
);

const app = createApp({ routers: [probe] });
const errorOf = (body: unknown) => (body as ApiError).error;

describe('GET /health', () => {
  it('returns status, uptime and timestamp in the success envelope', async () => {
    const response = await request(app).get('/health');
    const body = response.body as ApiSuccess<{ timestamp: string }>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: { status: 'ok', uptime: expect.any(Number) as number },
    });
    expect(Number.isNaN(Date.parse(body.data.timestamp))).toBe(false);
  });
});

describe('security headers', () => {
  it('sends a strict JSON-API header set', async () => {
    const { headers } = await request(app).get('/health');

    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['content-security-policy']).toBe(
      "default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'none'",
    );
    expect(headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['cross-origin-resource-policy']).toBe('same-site');
    expect(headers['cache-control']).toBe('no-store');
  });
});

describe('request id', () => {
  it('propagates a well-formed incoming id', async () => {
    const response = await request(app).get('/health').set('X-Request-Id', 'edge-1234abcd');
    expect(response.headers['x-request-id']).toBe('edge-1234abcd');
  });

  it('replaces a malformed id', async () => {
    const response = await request(app).get('/health').set('X-Request-Id', 'bad id {"level":60}');
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('CORS', () => {
  it('allows the frontend origin with credentials', async () => {
    const response = await request(app)
      .options('/api/v1/probe/validate')
      .set('Origin', ORIGIN)
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBe(ORIGIN);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('sends no CORS headers to other origins', async () => {
    const response = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('origin check on state-changing requests', () => {
  it('rejects a foreign origin', async () => {
    const response = await request(app)
      .post('/api/v1/probe/validate')
      .set('Origin', 'https://evil.example')
      .send({});
    expect(response.status).toBe(403);
    expect(errorOf(response.body).code).toBe(ERROR_CODES.CSRF_INVALID);
  });

  it('rejects a missing origin when session cookies are present', async () => {
    const response = await request(app)
      .post('/api/v1/probe/validate')
      .set('Cookie', 'codex_at=token')
      .send({});
    expect(response.status).toBe(403);
  });
});

describe('error responses', () => {
  it('returns the 404 shape with the request id', async () => {
    const response = await request(app).get('/api/v1/nope').set('X-Request-Id', 'trace-12345678');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: 'errors.notFound',
        requestId: 'trace-12345678',
      },
    });
  });

  it('returns field-level i18n keys for validation errors and strips unknown fields', async () => {
    const invalid = await request(app)
      .post('/api/v1/probe/validate')
      .set('Origin', ORIGIN)
      .send({ email: 'nope', password: '' });

    expect(invalid.status).toBe(400);
    expect(errorOf(invalid.body)).toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
      details: [
        { path: 'email', message: 'validation.email.invalid' },
        { path: 'password', message: 'validation.required' },
      ],
    });

    const valid = await request(app)
      .post('/api/v1/probe/validate')
      .set('Origin', ORIGIN)
      .send({ email: 'A@Codex.example', password: 'x', isAdmin: true });
    expect((valid.body as ApiSuccess<unknown>).data).toEqual({
      email: 'a@codex.example',
      password: 'x',
    });
  });

  it('rejects malformed JSON and oversized bodies', async () => {
    const malformed = await request(app)
      .post('/api/v1/probe/validate')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect([malformed.status, errorOf(malformed.body).code]).toEqual([
      400,
      ERROR_CODES.INVALID_JSON,
    ]);

    const huge = await request(app)
      .post('/api/v1/probe/validate')
      .send({ email: 'a@codex.example', password: 'x'.repeat(120_000) });
    expect([huge.status, errorOf(huge.body).code]).toEqual([413, ERROR_CODES.PAYLOAD_TOO_LARGE]);
  });

  it('never leaks internals of unexpected errors', async () => {
    const response = await request(app).get('/api/v1/probe/crash');

    expect(response.status).toBe(500);
    expect(errorOf(response.body)).toMatchObject({
      code: ERROR_CODES.INTERNAL,
      message: 'errors.internal',
    });
    expect(response.text).not.toMatch(/hunter2|secret\.ts|at \//);
  });

  it('cuts a response that fails mid-stream without printing to stderr', async () => {
    const streaming = createApp({ routers: [probe] });
    // Express prints errors it handles itself everywhere except in its "test" env.
    streaming.set('env', 'production');
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const outcome = await request(streaming)
      .get('/api/v1/probe/half-sent')
      .then(
        () => 'completed',
        (error: unknown) => (error instanceof Error ? error.message : 'failed'),
      );

    expect(outcome).not.toBe('completed');
    expect(stderr).not.toHaveBeenCalled();
    stderr.mockRestore();
  });
});

describe('rate limiting', () => {
  it('answers 429 with Retry-After once the limit is used', async () => {
    const first = await request(app).get('/api/v1/probe/limited');
    const second = await request(app).get('/api/v1/probe/limited');

    expect(first.status).toBe(200);
    expect(first.headers['ratelimit-remaining']).toBe('0');
    expect(second.status).toBe(429);
    expect(Number(second.headers['retry-after'])).toBeGreaterThan(0);
    expect(errorOf(second.body).code).toBe(ERROR_CODES.RATE_LIMITED);
  });
});
