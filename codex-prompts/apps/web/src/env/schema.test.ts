import { describe, expect, it } from 'vitest';

import { clientEnvSchema, parseEnv, serverEnvSchema } from './schema';

const validClientEnv = {
  NEXT_PUBLIC_API_URL: 'http://localhost:4000',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
};

describe('web env validation', () => {
  it('accepts a valid client env', () => {
    expect(parseEnv(clientEnvSchema, validClientEnv)).toEqual(validClientEnv);
  });

  it('lists every missing variable in one error', () => {
    expect(() => parseEnv(clientEnvSchema, {})).toThrow(
      /NEXT_PUBLIC_API_URL[\s\S]*NEXT_PUBLIC_SITE_URL[\s\S]*NEXT_PUBLIC_TURNSTILE_SITE_KEY/,
    );
  });

  it('requires the shared secrets on a production server, but not while building', () => {
    const production = { NODE_ENV: 'production', API_URL: 'http://api.test' };

    expect(() => parseEnv(serverEnvSchema, production)).toThrow(
      /INTERNAL_API_TOKEN: required[\s\S]*REVALIDATE_SECRET: required/,
    );
    expect(() =>
      parseEnv(serverEnvSchema, { ...production, NEXT_PHASE: 'phase-production-build' }),
    ).not.toThrow();
  });

  it('rejects short or placeholder secrets', () => {
    const base = { API_URL: 'http://api.test' };
    expect(() => parseEnv(serverEnvSchema, { ...base, INTERNAL_API_TOKEN: 'short' })).toThrow(
      /INTERNAL_API_TOKEN: must be at least 32 bytes/,
    );
    expect(() =>
      parseEnv(serverEnvSchema, { ...base, REVALIDATE_SECRET: `change-me-${'x'.repeat(32)}` }),
    ).toThrow(/REVALIDATE_SECRET: still the .env.example placeholder/);
  });

  it('rejects non-http urls', () => {
    expect(() => parseEnv(serverEnvSchema, { API_URL: 'ftp://example.com' })).toThrow(/API_URL/);
  });
});
