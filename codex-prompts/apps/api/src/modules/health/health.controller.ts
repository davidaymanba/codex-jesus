import type { Request, Response } from 'express';

import { ERROR_CODES } from '@codex/shared';

import { AppError } from '@/lib/errors.js';
import { sendSuccess } from '@/utils/response.js';

import { getReadiness } from './health.service.js';

/** Liveness: the process is up and serving. Never touches dependencies. */
export function getLiveness(_req: Request, res: Response): void {
  sendSuccess(res, { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
}

/** Readiness: 200 when the database answers (Redis may be degraded), otherwise 503. */
export async function getReadinessStatus(_req: Request, res: Response): Promise<void> {
  const readiness = await getReadiness();
  if (readiness.status === 'down') {
    throw new AppError({ statusCode: 503, code: ERROR_CODES.SERVICE_UNAVAILABLE });
  }
  sendSuccess(res, readiness);
}
