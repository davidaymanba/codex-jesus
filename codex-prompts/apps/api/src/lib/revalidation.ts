import { REVALIDATION, signRevalidation } from '@codex/shared';

import { REVALIDATION_WEBHOOK } from '@/config/constants.js';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

const MS_PER_SECOND = 1000;

interface RevalidatorOptions {
  /** The web app's revalidation route. */
  url: string;
  /** Unset: revalidation is disabled (development without the web app). */
  secret: string | undefined;
  fetchImpl?: typeof fetch;
  retryDelaysMs?: readonly number[];
  coalesceMs?: number;
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms).unref();
  });

/**
 * Fire-and-forget client for the web revalidation webhook (docs/phases/03 §8). Tags from
 * writes close together are merged into one signed request, retried with backoff; failures
 * are logged and never reach the admin write that triggered them.
 */
export function createRevalidator({
  url,
  secret,
  fetchImpl = fetch,
  retryDelaysMs = REVALIDATION_WEBHOOK.RETRY_DELAYS_MS,
  coalesceMs = REVALIDATION_WEBHOOK.COALESCE_MS,
}: RevalidatorOptions) {
  const pendingTags = new Set<string>();
  const inFlight = new Set<Promise<void>>();
  let timer: NodeJS.Timeout | undefined;

  async function post(signingSecret: string, tags: string[]): Promise<void> {
    const body = JSON.stringify({ tags });
    const timestamp = String(Math.floor(Date.now() / MS_PER_SECOND));
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [REVALIDATION.TIMESTAMP_HEADER]: timestamp,
        [REVALIDATION.SIGNATURE_HEADER]: await signRevalidation(signingSecret, timestamp, body),
      },
      body,
      signal: AbortSignal.timeout(REVALIDATION_WEBHOOK.TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Revalidation webhook answered ${response.status}`);
  }

  async function deliver(signingSecret: string, tags: string[]): Promise<void> {
    for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
      try {
        await post(signingSecret, tags);
        return;
      } catch (error) {
        const delay = retryDelaysMs[attempt];
        if (delay === undefined) {
          logger.error({ err: error, tags }, 'Revalidation webhook failed; giving up');
          return;
        }
        logger.warn({ err: error, attempt: attempt + 1 }, 'Revalidation webhook failed; retrying');
        await sleep(delay);
      }
    }
  }

  /** Sends everything queued, in as many requests as the web route's tag cap requires. */
  function send(): void {
    timer = undefined;
    if (!secret) return;
    const tags = [...pendingTags];
    pendingTags.clear();
    for (let start = 0; start < tags.length; start += REVALIDATION.MAX_TAGS) {
      const batch = tags.slice(start, start + REVALIDATION.MAX_TAGS);
      const delivery = deliver(secret, batch).finally(() => inFlight.delete(delivery));
      inFlight.add(delivery);
    }
  }

  return {
    /** Queues tags for the next webhook call; returns immediately. */
    revalidate(tags: readonly string[]): void {
      if (!secret) return;
      for (const tag of tags) pendingTags.add(tag);
      timer ??= setTimeout(send, coalesceMs);
      timer.unref();
    },
    /** Sends anything queued and waits for deliveries in flight (shutdown and tests). */
    async flush(): Promise<void> {
      if (timer) {
        clearTimeout(timer);
        send();
      }
      await Promise.all([...inFlight]);
    },
  };
}

export type Revalidator = ReturnType<typeof createRevalidator>;

/** The process-wide client for `${FRONTEND_URL}/api/revalidate`. */
export const revalidator: Revalidator = createRevalidator({
  url: new URL(REVALIDATION.PATH, env.FRONTEND_URL).toString(),
  secret: env.REVALIDATE_SECRET,
});
