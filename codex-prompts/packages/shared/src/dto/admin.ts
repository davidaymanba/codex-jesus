import { z } from 'zod';

import { timestampDtoSchema } from './common.js';
import { auditActionSchema } from '../enums/audit-action.js';
import { auditEntitySchema } from '../enums/audit-entity.js';
import { leadStatusSchema } from '../enums/lead-status.js';
import { roleSchema } from '../enums/role.js';
import { serviceOfferingSchema } from '../enums/service-offering.js';

export const adminUserDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  isActive: z.boolean(),
  lastLoginAt: timestampDtoSchema.nullable(),
  createdAt: timestampDtoSchema,
  updatedAt: timestampDtoSchema,
});

export const auditLogDtoSchema = z.object({
  id: z.uuid(),
  actor: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  action: auditActionSchema,
  entity: auditEntitySchema,
  entityId: z.string().nullable(),
  changes: z.unknown().nullable(),
  createdAt: timestampDtoSchema,
});

export const dashboardStatsDtoSchema = z.object({
  counts: z.object({
    newQuotes: z.int(),
    newMessages: z.int(),
    publishedPosts: z.int(),
    publishedProjects: z.int(),
  }),
  latestLeads: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      services: z.array(serviceOfferingSchema),
      status: leadStatusSchema,
      createdAt: timestampDtoSchema,
    }),
  ),
  /** The last 12 months, oldest first; months without leads are zeros. */
  leadsPerMonth: z.array(
    z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/),
      quotes: z.int(),
      messages: z.int(),
    }),
  ),
});

export type AdminUserDto = z.infer<typeof adminUserDtoSchema>;
export type AuditLogDto = z.infer<typeof auditLogDtoSchema>;
export type DashboardStatsDto = z.infer<typeof dashboardStatsDtoSchema>;
