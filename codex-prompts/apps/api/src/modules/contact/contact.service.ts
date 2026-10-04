import type { Writable } from 'node:stream';

import {
  AuditAction,
  AuditEntity,
  type ContactMessageDto,
  type ContactMessageExportQuery,
  type ContactMessageQuery,
  type PaginationMeta,
  type UpdateContactMessageInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { NotFoundError } from '@/lib/errors.js';
import { auditLog } from '@/modules/audit-log/audit-log.service.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { streamCsv } from '@/modules/leads/csv.js';
import { paginate } from '@/utils/pagination.js';

import { CONTACT_CSV_HEADER, toContactCsvCells, toContactMessageDto } from './contact.mapper.js';
import { ContactRepository } from './contact.repository.js';

const messages = new ContactRepository();

export async function listContactMessages(
  query: ContactMessageQuery,
): Promise<{ items: ContactMessageDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await messages.list(query, page);
  return { items: rows.map(toContactMessageDto), meta: page.toMeta(total) };
}

export async function getContactMessage(id: string): Promise<ContactMessageDto> {
  const row = await messages.findById(id);
  if (!row) throw new NotFoundError();
  return toContactMessageDto(row);
}

export async function updateContactMessage(
  id: string,
  input: UpdateContactMessageInput,
  actor: Actor,
): Promise<ContactMessageDto> {
  const before = await getContactMessage(id);
  return withTransaction(async (tx) => {
    const after = toContactMessageDto(await new ContactRepository(tx).update(id, input));
    await auditWrite(tx, actor, {
      action: before.status === after.status ? AuditAction.UPDATE : AuditAction.STATUS_CHANGE,
      entity: AuditEntity.CONTACT_MESSAGE,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
}

/** Streams matching messages as CSV to `out`, then audits the export. */
export async function exportContactMessages(
  filters: ContactMessageExportQuery,
  out: Writable,
  actor: Actor,
): Promise<void> {
  const rows = await streamCsv(
    out,
    CONTACT_CSV_HEADER,
    messages.batches(filters),
    toContactCsvCells,
  );
  await auditLog.record({
    actorId: actor.userId,
    action: AuditAction.EXPORT,
    entity: AuditEntity.CONTACT_MESSAGE,
    changes: { filters, rows },
    ip: actor.ip,
  });
}
