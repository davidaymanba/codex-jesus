import type { AuditLogDto, AuditLogQuery, PaginationMeta } from '@codex/shared';

import { paginate } from '@/utils/pagination.js';

import { AuditLogRepository, type AuditLogRow } from './audit-log.repository.js';

const repository = new AuditLogRepository();

const toAuditLogDto = (row: AuditLogRow): AuditLogDto => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

/** The audit trail for admins (read-only: the table is append-only for the app role). */
export async function listAuditLog(
  query: AuditLogQuery,
): Promise<{ items: AuditLogDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await repository.list(query, page);
  return { items: rows.map(toAuditLogDto), meta: page.toMeta(total) };
}
