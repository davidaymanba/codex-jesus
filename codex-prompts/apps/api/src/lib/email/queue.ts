import { EMAIL_QUEUE } from '@/config/constants.js';
import { logger, maskPii } from '@/lib/logger.js';

import { emailTransport, type EmailMessage, type EmailTransport } from './transport.js';

/** One email to send; `build` renders it lazily, off the request path. */
export interface EmailJob {
  /** For logs only, e.g. `quote-confirmation`. */
  name: string;
  build: () => Promise<EmailMessage>;
}

interface QueueOptions {
  transport?: EmailTransport;
  concurrency?: number;
  retryDelaysMs?: readonly number[];
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms).unref();
  });

/**
 * A small in-process queue with retry and backoff. Requests return as soon as a job is queued.
 * Jobs live in memory: a crash loses unsent mail, which is acceptable because every lead is
 * already saved and shown in the admin; graceful shutdown drains the queue first.
 */
export function createEmailQueue({
  transport = emailTransport,
  concurrency = EMAIL_QUEUE.CONCURRENCY,
  retryDelaysMs = EMAIL_QUEUE.RETRY_DELAYS_MS,
}: QueueOptions = {}) {
  const waiting: EmailJob[] = [];
  const running = new Set<Promise<void>>();
  let idleWaiters: (() => void)[] = [];

  async function attempt(job: EmailJob): Promise<void> {
    const message = await job.build();
    for (let attemptIndex = 0; ; attemptIndex += 1) {
      try {
        await transport.send(message);
        return;
      } catch (error) {
        const delay = retryDelaysMs[attemptIndex];
        const context = { err: error, job: job.name, to: maskPii(message.to, 'email') };
        if (delay === undefined) {
          logger.error(context, 'Email failed; giving up');
          return;
        }
        logger.warn({ ...context, attempt: attemptIndex + 1 }, 'Email failed; retrying');
        await sleep(delay);
      }
    }
  }

  function pump(): void {
    while (running.size < concurrency && waiting.length > 0) {
      const job = waiting.shift();
      if (!job) return;
      const run: Promise<void> = attempt(job)
        .catch((error: unknown) => {
          logger.error({ err: error, job: job.name }, 'Email could not be built');
        })
        .finally(() => {
          running.delete(run);
          pump();
        });
      running.add(run);
    }
    if (running.size === 0 && waiting.length === 0) {
      for (const resolve of idleWaiters) resolve();
      idleWaiters = [];
    }
  }

  return {
    enqueue(job: EmailJob): void {
      waiting.push(job);
      pump();
    },
    /** Resolves once everything queued is sent or given up (or after `timeoutMs`). */
    async drain(timeoutMs: number = EMAIL_QUEUE.DRAIN_TIMEOUT_MS): Promise<boolean> {
      if (running.size === 0 && waiting.length === 0) return true;
      const idle = new Promise<true>((resolve) => {
        idleWaiters.push(() => {
          resolve(true);
        });
      });
      const isDrained = await Promise.race([idle, sleep(timeoutMs).then(() => false)]);
      if (!isDrained) {
        logger.error({ pending: waiting.length + running.size }, 'Email queue not drained');
      }
      return isDrained;
    },
    get size(): number {
      return waiting.length + running.size;
    },
  };
}

export type EmailQueue = ReturnType<typeof createEmailQueue>;

/** The process-wide queue. */
export const emailQueue: EmailQueue = createEmailQueue();
