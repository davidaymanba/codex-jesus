import { describe, expect, it } from 'vitest';

import { buildCsp, createNonce } from './csp';

const directivesOf = (policy: string) =>
  new Map(
    policy.split('; ').map((directive) => {
      const [name = '', ...sources] = directive.split(' ');
      return [name, sources];
    }),
  );

describe('buildCsp', () => {
  const production = directivesOf(
    buildCsp({
      nonce: 'abc123',
      apiOrigin: 'https://api.codex.test',
      isDevelopment: false,
      isHttpsSite: true,
    }),
  );

  it('runs only scripts carrying the nonce, never eval or inline handlers', () => {
    expect(production.get('script-src')).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
  });

  it('allows only the API, Cloudinary and Turnstile as third parties', () => {
    expect(production.get('connect-src')).toEqual([
      "'self'",
      'https://api.codex.test',
      'https://challenges.cloudflare.com',
    ]);
    expect(production.get('img-src')).toContain('https://res.cloudinary.com');
    expect(production.get('frame-src')).toEqual([
      'https://challenges.cloudflare.com',
      'https://www.google.com',
    ]);
  });

  it('forbids framing, plugins and foreign base URLs, and upgrades http', () => {
    expect(production.get('frame-ancestors')).toEqual(["'none'"]);
    expect(production.get('object-src')).toEqual(["'none'"]);
    expect(production.get('base-uri')).toEqual(["'self'"]);
    expect(production.has('upgrade-insecure-requests')).toBe(true);
  });

  it('relaxes only what development tooling needs', () => {
    const development = directivesOf(
      buildCsp({
        nonce: 'n',
        apiOrigin: 'http://localhost:4000',
        isDevelopment: true,
        isHttpsSite: false,
      }),
    );
    expect(development.get('script-src')).toContain("'unsafe-eval'");
    expect(development.get('connect-src')).toContain('ws:');
    expect(development.has('upgrade-insecure-requests')).toBe(false);
  });
});

describe('createNonce', () => {
  it('returns a different base64 value on every call', () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});
