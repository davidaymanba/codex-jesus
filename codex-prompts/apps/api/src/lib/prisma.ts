import { PrismaPg } from '@prisma/adapter-pg';

import { env } from '@/config/env.js';
import { PrismaClient, type Prisma } from '@/generated/prisma/client.js';
import { logger } from '@/lib/logger.js';

/** A client or an interactive-transaction client; repositories accept either. */
export type DbClient = PrismaClient | Prisma.TransactionClient;

const queryListeners = new Set<() => void>();

/**
 * Calls `listener` after every SQL statement (outside production only); returns the
 * unsubscribe function. Tests use it to prove list endpoints make no N+1 queries.
 */
export function onQuery(listener: () => void): () => void {
  queryListeners.add(listener);
  return () => queryListeners.delete(listener);
}

function createPrismaClient(): PrismaClient {
  // Query events: logged (debug) while developing; counted by the N+1 tests.
  const hasQueryEvents = env.NODE_ENV !== 'production';
  const log: Prisma.LogDefinition[] = [
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ];
  if (hasQueryEvents) log.push({ emit: 'event', level: 'query' });

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log,
  });

  client.$on('warn', (event) => {
    logger.warn({ target: event.target }, event.message);
  });
  client.$on('error', (event) => {
    logger.error({ target: event.target }, event.message);
  });
  if (hasQueryEvents) {
    // Parameters are deliberately not logged: they can hold PII and password hashes.
    client.$on('query', (event) => {
      logger.debug({ durationMs: event.duration, query: event.query }, 'prisma query');
      for (const listener of queryListeners) listener();
    });
  }
  return client;
}

/**
 * The process-wide Prisma client. An ES module is evaluated once, so this is a singleton;
 * `tsx watch` restarts the whole process, so no globalThis caching is needed.
 * Import it only from repositories (CLAUDE.md §6).
 */
export const prisma = createPrismaClient();
