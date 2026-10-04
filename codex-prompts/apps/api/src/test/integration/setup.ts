import { afterAll, beforeEach } from 'vitest';

import { prisma } from '@/lib/prisma.js';
import { closeRedis, connectRedis, redis } from '@/lib/redis.js';

import { ownerDb, resetDatabase } from './database.js';

const REDIS_READY_TIMEOUT_MS = 5_000;

async function waitForRedis(): Promise<void> {
  if (!redis) return;
  connectRedis();
  const deadline = Date.now() + REDIS_READY_TIMEOUT_MS;
  while (!redis.isReady) {
    if (Date.now() > deadline) throw new Error('Redis is not reachable for integration tests');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

beforeEach(async () => {
  await waitForRedis();
  // Rate-limit counters and cache entries live in Redis database 1, reserved for tests.
  await redis?.flushDb();
  await resetDatabase();
});

afterAll(async () => {
  // Imported here, not at the top: a static import would load the app before a test file's
  // vi.mock() calls apply.
  const { app } = await import('./http.js');
  app.closeAllConnections();
  await new Promise((resolve) => app.close(resolve));
  await Promise.all([prisma.$disconnect(), ownerDb.$disconnect(), closeRedis()]);
});
