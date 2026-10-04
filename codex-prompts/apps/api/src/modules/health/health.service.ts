import { HEALTH_CHECK_TIMEOUT_MS } from '@/config/constants.js';
import { logger } from '@/lib/logger.js';
import { redis } from '@/lib/redis.js';

import { HealthRepository } from './health.repository.js';
import type { CheckStatus, Readiness } from './health.schemas.js';

const healthRepository = new HealthRepository();

function withTimeout(work: Promise<unknown>): Promise<unknown> {
  return Promise.race([
    work,
    new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Health check timed out'));
      }, HEALTH_CHECK_TIMEOUT_MS).unref();
    }),
  ]);
}

async function check(name: string, probe: () => Promise<unknown>): Promise<CheckStatus> {
  try {
    await withTimeout(probe());
    return 'ok';
  } catch (error) {
    logger.warn({ err: error, check: name }, 'Readiness check failed');
    return 'down';
  }
}

/**
 * The database is required (no data, no API). Redis is optional by design, so its outage
 * degrades the API instead of taking it out of rotation.
 */
export async function getReadiness(): Promise<Readiness> {
  const client = redis;
  const [database, redisStatus] = await Promise.all([
    check('database', () => healthRepository.pingDatabase()),
    client ? check('redis', () => client.ping()) : Promise.resolve<CheckStatus>('disabled'),
  ]);
  const status = database === 'down' ? 'down' : redisStatus === 'down' ? 'degraded' : 'ok';
  return { status, checks: { database, redis: redisStatus } };
}
