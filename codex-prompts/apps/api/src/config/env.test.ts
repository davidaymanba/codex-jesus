import { describe, expect, it } from 'vitest';

import { createTestEnv, productionEnvOverrides } from '@/test/test-env.js';

import { EnvValidationError, parseEnv } from './env.js';

const REQUIRED = createTestEnv();

function issuesOf(source: Record<string, string | undefined>): string[] {
  try {
    parseEnv(source);
    return [];
  } catch (error) {
    if (error instanceof EnvValidationError) return error.issues;
    throw error;
  }
}

describe('parseEnv', () => {
  it('applies defaults for optional variables', () => {
    const env = parseEnv({ ...REQUIRED, NODE_ENV: undefined, LOG_LEVEL: undefined });
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      LOG_LEVEL: 'info',
      TRUST_PROXY_HOPS: 0,
      JWT_ISSUER: 'codex-api',
      JWT_AUDIENCE: 'codex-admin',
    });
  });

  it('throws a readable error listing every missing or invalid variable', () => {
    const issues = issuesOf({ PORT: 'abc' });
    for (const key of ['PORT', 'FRONTEND_URL', 'JWT_PRIVATE_KEY', 'CSRF_SECRET']) {
      expect(issues.some((issue) => issue.startsWith(`${key}:`))).toBe(true);
    }
  });

  it('never echoes secret values in its messages', () => {
    const issues = issuesOf({ ...REQUIRED, CSRF_SECRET: 'too-short-secret-value' });
    expect(issues.join('\n')).not.toContain('too-short-secret-value');
  });

  it.each([
    ['FRONTEND_URL', 'javascript:alert(1)'],
    ['DATABASE_URL', 'mysql://localhost/codex'],
    ['REDIS_URL', 'http://localhost:6379'],
    ['COOKIE_DOMAIN', 'https://codex.com'],
    ['JWT_PRIVATE_KEY', Buffer.from('not a key').toString('base64')],
    ['IP_HASH_SECRET', 'short'],
  ])('rejects an invalid %s', (key, value) => {
    expect(issuesOf({ ...REQUIRED, [key]: value }).some((i) => i.startsWith(`${key}:`))).toBe(true);
  });

  it('treats empty optional values as unset', () => {
    expect(
      parseEnv({ ...REQUIRED, COOKIE_DOMAIN: '', REDIS_URL: '', DOCS_USERNAME: '' }),
    ).toMatchObject({ COOKIE_DOMAIN: undefined, REDIS_URL: undefined, DOCS_USERNAME: undefined });
  });

  it('requires both docs credentials or neither', () => {
    expect(issuesOf({ ...REQUIRED, DOCS_USERNAME: 'docs' })).toEqual([
      'DOCS_PASSWORD: set both or neither',
    ]);
  });

  it('requires Redis, the integrations and real secrets in production', () => {
    const issues = issuesOf({
      ...REQUIRED,
      NODE_ENV: 'production',
      INTERNAL_API_TOKEN: undefined,
      CSRF_SECRET: 'change-me-change-me-change-me-change-me',
    });
    expect(issues).toEqual(
      expect.arrayContaining([
        'REDIS_URL: required in production',
        'REVALIDATE_SECRET: required in production',
        'INTERNAL_API_TOKEN: required in production',
        'TURNSTILE_SECRET_KEY: required in production',
        'RESEND_API_KEY: required in production',
        'CLOUDINARY_URL: required in production',
        'EMAIL_FROM: still the development default',
        'EMAIL_NOTIFY_TO: still the development default',
        'CSRF_SECRET: still the .env.example placeholder',
      ]),
    );
  });

  it('accepts a complete production environment', () => {
    expect(issuesOf({ ...REQUIRED, ...productionEnvOverrides() })).toEqual([]);
  });

  it.each([
    ['EMAIL_FROM', 'not an address'],
    ['EMAIL_NOTIFY_TO', 'Codex <leads@codex.com>'],
    ['CLOUDINARY_URL', 'https://api.cloudinary.com'],
    ['RESEND_API_KEY', 'sk_live_123'],
    ['REPORTING_TIME_ZONE', 'Mars/Olympus'],
  ])('rejects an invalid integration setting %s', (key, value) => {
    expect(issuesOf({ ...REQUIRED, [key]: value }).some((i) => i.startsWith(`${key}:`))).toBe(true);
  });
});
