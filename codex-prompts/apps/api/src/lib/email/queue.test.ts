import { describe, expect, it } from 'vitest';

import { createEmailQueue } from './queue.js';
import type { EmailMessage, EmailTransport } from './transport.js';

const message: EmailMessage = {
  to: 'client@example.com',
  subject: 'Hi',
  html: '<p>Hi</p>',
  text: 'Hi',
};

function flakyTransport(failures: number) {
  const sent: EmailMessage[] = [];
  let calls = 0;
  const transport: EmailTransport = {
    send(email) {
      calls += 1;
      if (calls <= failures) return Promise.reject(new Error('provider down'));
      sent.push(email);
      return Promise.resolve();
    },
  };
  return { sent, transport, calls: () => calls };
}

describe('email queue', () => {
  it('sends queued emails and drains', async () => {
    const { sent, transport } = flakyTransport(0);
    const queue = createEmailQueue({ transport, retryDelaysMs: [] });

    queue.enqueue({ name: 'a', build: () => Promise.resolve(message) });
    queue.enqueue({ name: 'b', build: () => Promise.resolve({ ...message, subject: 'Two' }) });

    expect(await queue.drain(1000)).toBe(true);
    expect(sent.map((email) => email.subject)).toEqual(['Hi', 'Two']);
  });

  it('retries with backoff, then gives up without throwing', async () => {
    const recovering = flakyTransport(2);
    const queue = createEmailQueue({ transport: recovering.transport, retryDelaysMs: [1, 1] });
    queue.enqueue({ name: 'retry', build: () => Promise.resolve(message) });
    await queue.drain(1000);
    expect([recovering.calls(), recovering.sent.length]).toEqual([3, 1]);

    const down = flakyTransport(10);
    const failing = createEmailQueue({ transport: down.transport, retryDelaysMs: [1] });
    failing.enqueue({ name: 'down', build: () => Promise.resolve(message) });
    expect(await failing.drain(1000)).toBe(true);
    expect([down.calls(), down.sent.length]).toEqual([2, 0]);
  });

  it('reports a drain timeout instead of hanging shutdown', async () => {
    const transport: EmailTransport = { send: () => new Promise(() => undefined) };
    const queue = createEmailQueue({ transport });
    queue.enqueue({ name: 'stuck', build: () => Promise.resolve(message) });

    expect(await queue.drain(20)).toBe(false);
    expect(queue.size).toBe(1);
  });
});
