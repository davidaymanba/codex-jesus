import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import { auditLogDtoSchema, auditLogQuerySchema, Permission } from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { ADMIN_ERRORS, adminRead } from '@/modules/docs/crud-openapi.js';
import { successResponse } from '@/modules/docs/openapi-helpers.js';

export const auditLogPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/admin/audit-log`]: {
    get: adminRead('Audit log', Permission.AUDIT_READ, {
      summary: 'Filter the audit trail (actor, action, entity, dates)',
      requestParams: { query: auditLogQuerySchema },
      responses: {
        '200': successResponse('A page of entries', z.array(auditLogDtoSchema)),
        ...ADMIN_ERRORS,
      },
    }),
  },
};
