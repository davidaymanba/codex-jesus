import { Writable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { buildRedactPaths, createLogger } from './logger.js';

function captureLog(payload: Record<string, unknown>): string {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  // A synchronous stream keeps the assertion free of timing concerns.
  createLogger(destination, 'info').info(payload, 'probe');
  return lines.join('');
}

describe('logger redaction', () => {
  it.each([
    ['top level', { password: 'leak-1' }],
    ['one level deep', { user: { passwordHash: 'leak-2' } }],
    ['two levels deep', { req: { body: { password: 'leak-3' } } }],
    ['request headers', { req: { headers: { authorization: 'Bearer leak-4', cookie: 'leak-5' } } }],
    ['response cookies', { res: { headers: { 'set-cookie': 'leak-6' } } }],
    ['tokens', { session: { accessToken: 'leak-7', refreshToken: 'leak-8', tokenHash: 'leak-9' } }],
  ])('redacts sensitive values at the %s', (_label, payload) => {
    const output = captureLog(payload);

    expect(output).not.toMatch(/leak-\d/);
    expect(output).toContain('[REDACTED]');
  });

  it('masks emails and phone numbers instead of removing them', () => {
    const output = captureLog({
      req: { body: { email: 'sara@codex.example', phone: '+966501234567' } },
    });

    expect(output).toContain('s***@codex.example');
    expect(output).toContain('***67');
    expect(output).not.toMatch(/sara@|501234/);
  });

  it('keeps non-sensitive fields', () => {
    expect(captureLog({ user: { name: 'Sara', role: 'ADMIN' } })).toContain('"role":"ADMIN"');
  });

  it('expands each key once per depth level', () => {
    expect(buildRedactPaths(['password', 'set-cookie'], 3)).toEqual([
      'password',
      '*.password',
      '*.*.password',
      '["set-cookie"]',
      '*["set-cookie"]',
      '*.*["set-cookie"]',
    ]);
  });
});
