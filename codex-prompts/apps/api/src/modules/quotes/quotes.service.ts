import type { Writable } from 'node:stream';

import {
  AuditAction,
  AuditEntity,
  VALIDATION_MESSAGES as MSG,
  type PaginationMeta,
  type QuoteRequestDto,
  type QuoteRequestExportQuery,
  type QuoteRequestQuery,
  type UpdateQuoteRequestInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { NotFoundError, ValidationError } from '@/lib/errors.js';
import { auditLog } from '@/modules/audit-log/audit-log.service.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { streamCsv } from '@/modules/leads/csv.js';
import { paginate } from '@/utils/pagination.js';

import { QUOTE_CSV_HEADER, toQuoteCsvCells, toQuoteRequestDto } from './quotes.mapper.js';
import { QuoteRepository } from './quotes.repository.js';

const quotes = new QuoteRepository();

export async function listQuotes(
  query: QuoteRequestQuery,
): Promise<{ items: QuoteRequestDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await quotes.list(query, page);
  return { items: rows.map(toQuoteRequestDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string): Promise<QuoteRequestDto> {
  const row = await quotes.findById(id);
  if (!row) throw new NotFoundError();
  return toQuoteRequestDto(row);
}

export const getQuote = findOrFail;

/** Status, assignee and internal notes. A status change is audited as STATUS_CHANGE. */
export async function updateQuote(
  id: string,
  input: UpdateQuoteRequestInput,
  actor: Actor,
): Promise<QuoteRequestDto> {
  const before = await findOrFail(id);
  if (input.assignedToId && !(await quotes.isActiveUser(input.assignedToId))) {
    throw new ValidationError([{ path: 'assignedToId', message: MSG.INVALID_ID }]);
  }
  return withTransaction(async (tx) => {
    const after = toQuoteRequestDto(await new QuoteRepository(tx).update(id, input));
    await auditWrite(tx, actor, {
      action: before.status === after.status ? AuditAction.UPDATE : AuditAction.STATUS_CHANGE,
      entity: AuditEntity.QUOTE_REQUEST,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
}

/** Streams matching quote requests as CSV to `out`, then audits the export. */
export async function exportQuotes(
  filters: QuoteRequestExportQuery,
  out: Writable,
  actor: Actor,
): Promise<void> {
  const rows = await streamCsv(out, QUOTE_CSV_HEADER, quotes.batches(filters), toQuoteCsvCells);
  await auditLog.record({
    actorId: actor.userId,
    action: AuditAction.EXPORT,
    entity: AuditEntity.QUOTE_REQUEST,
    changes: { filters, rows },
    ip: actor.ip,
  });
}
