import { Writable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import type * as LoggerModule from '@/lib/logger.js';
import { createUser, TEST_PASSWORD } from '@/test/integration/database.js';
import { login } from '@/test/integration/http.js';

const captured = vi.hoisted(() => ({ lines: [] as string[] }));

// The real logger configuration (redaction and masking), writing to memory at info level.
vi.mock('@/lib/logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LoggerModule>();
  const sink = new Writable({
    write(chunk: Buffer, _encoding, done) {
      captured.lines.push(chunk.toString());
      done();
    },
  });
  return { ...actual, logger: actual.createLogger(sink, 'info') };
});

describe('auth logs', () => {
  it('contain no email, password, token, cookie or IP (CLAUDE.md §8)', async () => {
    const user = await createUser({ email: 'private.person@codex.example' });
    const { response } = await login(user.email, TEST_PASSWORD);
    await login(user.email, 'Wrong-Password-1');
    const log = captured.lines.join('');

    expect(log).toContain('POST /api/v1/auth/login 200');
    expect(log).toContain('POST /api/v1/auth/login 401');
    const cookies = [response.headers['set-cookie']].flat().join(';');
    const secrets = [user.email, TEST_PASSWORD, 'Wrong-Password-1', '127.0.0.1', '::ffff:'];
    for (const value of [...secrets, ...cookieValues(cookies)]) {
      expect(log).not.toContain(value);
    }
  });
});

function cookieValues(header: string): string[] {
  return [...header.matchAll(/codex_\w+=([^;]+)/g)].flatMap((match) => match[1] ?? []);
}
