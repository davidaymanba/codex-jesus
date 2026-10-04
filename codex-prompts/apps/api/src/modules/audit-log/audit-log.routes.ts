import { Router, type Response } from 'express';

import { auditLogQuerySchema, Permission, type AuditLogQuery } from '@codex/shared';

import type { QueryRequest } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';
import { sendSuccess } from '@/utils/response.js';

import { listAuditLog } from './audit-log.admin.js';

async function getAuditLog(req: QueryRequest<AuditLogQuery>, res: Response): Promise<void> {
  const { items, meta } = await listAuditLog(req.query);
  sendSuccess(res, items, meta);
}

export const auditLogRouter: Router = Router();

// ADMIN only (docs/phases/03 §4).
auditLogRouter.get(
  '/admin/audit-log',
  permitted(Permission.AUDIT_READ, { query: auditLogQuerySchema }),
  getAuditLog,
);
