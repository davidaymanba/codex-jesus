import type { AuditLogQuery } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { orderByOf } from '@/utils/sort.js';

export const AUDIT_LOG_SELECT = {
  id: true,
  actor: { select: { id: true, name: true } },
  action: true,
  entity: true,
  entityId: true,
  changes: true,
  createdAt: true,
} as const satisfies Prisma.AuditLogSelect;

export type AuditLogRow = Prisma.AuditLogGetPayload<{ select: typeof AUDIT_LOG_SELECT }>;

export class AuditLogRepository extends BaseRepository {
  async list(query: AuditLogQuery, page: { skip: number; take: number }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.actorId && { actorId: query.actorId }),
      ...(query.action && { action: query.action }),
      ...(query.entity && { entity: query.entity }),
      ...(query.entityId && { entityId: query.entityId }),
      ...((query.from ?? query.to) && {
        createdAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
    };
    const [rows, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        select: AUDIT_LOG_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.auditLog.count({ where }),
    ]);
    return { rows, total };
  }

  async create(data: Prisma.AuditLogUncheckedCreateInput): Promise<void> {
    await this.db.auditLog.create({ data, select: { id: true } });
  }
}
