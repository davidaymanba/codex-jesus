import type { Server } from 'node:http';

import { createApp } from '@/app.js';
import { HTTP_TIMEOUTS, SHUTDOWN_TIMEOUT_MS } from '@/config/constants.js';
import { env } from '@/config/env.js';
import { emailQueue } from '@/lib/email/queue.js';
import { startServer } from '@/lib/http-server.js';
import { logger } from '@/lib/logger.js';
import { prisma } from '@/lib/prisma.js';
import { closeRedis, connectRedis } from '@/lib/redis.js';
import { revalidator } from '@/lib/revalidation.js';
import { startPublicationScheduler } from '@/modules/content/publication-scheduler.js';

let server: Server | undefined;
let stopScheduler: (() => void) | undefined;
let isShuttingDown = false;

/**
 * Finishes background work (queued webhooks and emails), then releases the database pool and the Redis
 * connection; resolves to whether everything closed cleanly. SHUTDOWN_TIMEOUT_MS bounds it.
 */
async function closeConnections(): Promise<boolean> {
  await Promise.all([revalidator.flush(), emailQueue.drain()]);
  const results = await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
  const failures = results.filter((result) => result.status === 'rejected');
  for (const failure of failures) {
    logger.error({ err: failure.reason }, 'Error while closing a connection');
  }
  return failures.length === 0;
}

/**
 * Stops accepting connections, lets in-flight requests finish (bounded by
 * SHUTDOWN_TIMEOUT_MS), closes Prisma and Redis, then exits with `exitCode`.
 */
function shutdown(reason: string, exitCode = 0): void {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ reason }, 'Shutting down gracefully');
  stopScheduler?.();

  const forceExitTimer = setTimeout(() => {
    logger.error('Shutdown timed out; forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  const finish = (isClean: boolean): void => {
    logger.info('Shutdown complete');
    process.exit(isClean ? exitCode : 1);
  };
  if (!server) {
    void closeConnections().then(finish);
    return;
  }
  server.close((closeError) => {
    if (closeError) logger.error({ err: closeError }, 'Error while closing the HTTP server');
    void closeConnections().then((isClean) => {
      finish(isClean && !closeError);
    });
  });
  server.closeIdleConnections();
}

// Crash through the structured logger, then still drain requests and close connections.
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  shutdown('uncaughtException', 1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  shutdown('unhandledRejection', 1);
});
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});

// Redis is optional: the API serves requests while the client (re)connects in the background.
connectRedis();

try {
  server = await startServer(createApp(), env.PORT);
  // Outlive the load balancer's idle timeout so it never reuses a socket we just closed.
  server.keepAliveTimeout = HTTP_TIMEOUTS.KEEP_ALIVE_MS;
  server.headersTimeout = HTTP_TIMEOUTS.HEADERS_MS;
  logger.info({ port: env.PORT }, 'API listening');
  stopScheduler = startPublicationScheduler().stop;
} catch (error) {
  logger.fatal({ err: error, port: env.PORT }, 'Failed to start the HTTP server');
  shutdown('startup failure', 1);
}
