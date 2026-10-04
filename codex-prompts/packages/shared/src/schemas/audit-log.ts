import type { z } from 'zod';

import { idSchema, requiredString } from './common.js';
import {
  createSortSchema,
  dateRangeFields,
  paginationSchema,
  refineDateRange,
} from './pagination.js';
import { auditActionSchema } from '../enums/audit-action.js';
import { auditEntitySchema } from '../enums/audit-entity.js';

const ENTITY_ID_MAX = 64;

/** Audit entries are written by services only, so the log exposes a query schema alone. */
export const auditLogQuerySchema = paginationSchema
  .extend({
    actorId: idSchema.optional(),
    action: auditActionSchema.optional(),
    entity: auditEntitySchema.optional(),
    entityId: requiredString({ max: ENTITY_ID_MAX }).optional(),
    ...dateRangeFields,
  })
  .extend(createSortSchema(['createdAt'], { sortBy: 'createdAt', sortOrder: 'desc' }).shape)
  .superRefine(refineDateRange);

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
