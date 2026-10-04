import type { ZodOpenApiPathsObject } from 'zod-openapi';

import { dashboardStatsDtoSchema, Permission } from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { ADMIN_ERRORS, adminRead } from '@/modules/docs/crud-openapi.js';
import { successResponse } from '@/modules/docs/openapi-helpers.js';

export const dashboardPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/admin/dashboard/stats`]: {
    get: adminRead('Dashboard', Permission.LEADS_READ, {
      summary: 'Counts, latest 5 leads and leads per month (last 12, zero-filled)',
      description: 'One aggregate query; months follow REPORTING_TIME_ZONE.',
      responses: { '200': successResponse('Stats', dashboardStatsDtoSchema), ...ADMIN_ERRORS },
    }),
  },
};
