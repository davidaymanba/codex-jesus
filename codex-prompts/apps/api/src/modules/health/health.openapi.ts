import type { ZodOpenApiPathsObject } from 'zod-openapi';

import { HEALTH_PATH } from '@/config/constants.js';
import { errorResponse, successResponse } from '@/modules/docs/openapi-helpers.js';

import { livenessSchema, readinessSchema } from './health.schemas.js';

export const healthPaths: ZodOpenApiPathsObject = {
  [HEALTH_PATH]: {
    get: {
      tags: ['Health'],
      summary: 'Liveness probe',
      responses: { '200': successResponse('The process is up', livenessSchema) },
    },
  },
  [`${HEALTH_PATH}/ready`]: {
    get: {
      tags: ['Health'],
      summary: 'Readiness probe (database + Redis)',
      responses: {
        '200': successResponse('Ready; Redis may be degraded', readinessSchema),
        '503': errorResponse('The database is unreachable'),
      },
    },
  },
};
