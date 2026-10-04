import type { AuditAction, AuditEntity } from '@codex/shared';

import { AUDIT_VALUE_MAX_LENGTH, SENSITIVE_LOG_KEYS } from '@/config/constants.js';
import type { Prisma } from '@/generated/prisma/client.js';
import { hashIp } from '@/lib/hash.js';
import type { DbClient } from '@/lib/prisma.js';

import { AuditLogRepository } from './audit-log.repository.js';

export interface AuditEntry {
  actorId?: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  /** Field-level diff or event details; secrets are stripped before writing. */
  changes?: Record<string, unknown> | null;
  /** Raw client IP; only its HMAC is stored. */
  ip?: string | undefined;
}

const SECRET_KEYS: ReadonlySet<string> = new Set(
  SENSITIVE_LOG_KEYS.map((key) => key.toLowerCase()),
);
const REMOVED = '[REMOVED]';
const TRUNCATED = '[TRUNCATED]';

/** Deep copy without secret keys; values whose JSON is too long are replaced by a marker. */
export function sanitizeChanges(value: unknown): Prisma.InputJsonValue | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => sanitizeChanges(item));
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([key, nested]) => [
      key,
      SECRET_KEYS.has(key.toLowerCase()) ? REMOVED : sanitizeChanges(nested),
    ]);
    return Object.fromEntries(entries) as Prisma.InputJsonObject;
  }
  if (typeof value === 'string') {
    return value.length > AUDIT_VALUE_MAX_LENGTH ? TRUNCATED : value;
  }
  // Functions, symbols and bigints have no JSON form; they never belong in an audit entry.
  return typeof value === 'number' || typeof value === 'boolean' ? value : null;
}

/**
 * Field-level diff `{ field: { from, to } }` of the keys that changed, for UPDATE entries.
 * Compared by JSON value, so nested (localized) fields diff correctly.
 */
export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = { from: before[key], to: after[key] };
    }
  }
  return diff;
}

const repository = new AuditLogRepository();

/**
 * Audit trail for admin operations and security events (CLAUDE.md §8). Called from services;
 * pass the transaction client so the entry commits or rolls back with the change it records.
 */
export const auditLog = {
  async record(entry: AuditEntry, db?: DbClient): Promise<void> {
    const target = db ? new AuditLogRepository(db) : repository;
    const changes = sanitizeChanges(entry.changes);
    await target.create({
      actorId: entry.actorId ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      ...(changes !== null && { changes }),
      ...(entry.ip !== undefined && { ipHash: hashIp(entry.ip) }),
    });
  },
};
