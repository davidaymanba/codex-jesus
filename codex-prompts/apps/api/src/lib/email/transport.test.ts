import { Writable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import type * as LoggerModule from '@/lib/logger.js';

const lines = vi.hoisted(() => [] as string[]);
vi.mock('@/lib/logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LoggerModule>();
  const sink = new Writable({
    write(chunk: Buffer, _encoding, done) {
      lines.push(chunk.toString());
      done();
    },
  });
  return { ...actual, logger: actual.createLogger(sink, 'info') };
});

const { createLogTransport } = await import('./transport.js');

describe('log transport', () => {
  it('logs a masked recipient only: no subject or body (they carry client PII)', async () => {
    await createLogTransport().send({
      to: 'private.person@client.example',
      subject: 'New contact message from Private Person',
      html: '<p>Private Person</p>',
      text: 'Private Person',
    });
    const log = lines.join('');

    expect(log).toContain('p***@client.example');
    expect(log).not.toContain('Private Person');
    expect(log).not.toContain('private.person@');
  });
});
