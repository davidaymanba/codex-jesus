import type { AuditAction, AuditEntity } from '@codex/shared';

import type { DbClient } from '@/lib/prisma.js';
import { auditLog, diffChanges } from '@/modules/audit-log/audit-log.service.js';
import type { Actor } from '@/modules/auth/actor.js';

// Bookkeeping fields: every update changes them, so they only add noise to a diff.
const IGNORED_IN_DIFF = new Set(['updatedAt', 'createdAt']);

/** Records an admin write inside its transaction, so the entry commits with the change. */
export function auditWrite(
  db: DbClient,
  actor: Actor,
  entry: {
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
    changes?: Record<string, unknown>;
  },
): Promise<void> {
  return auditLog.record({ ...entry, actorId: actor.userId, ip: actor.ip }, db);
}

/** Field-level diff of two DTO snapshots, without timestamps. */
export function diffOf(before: object, after: object): Record<string, unknown> {
  const diff = diffChanges({ ...before }, { ...after });
  return Object.fromEntries(Object.entries(diff).filter(([key]) => !IGNORED_IN_DIFF.has(key)));
}
