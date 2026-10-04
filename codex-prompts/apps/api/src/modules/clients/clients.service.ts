import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  entityTag,
  type AdminClientDto,
  type CreateClientInput,
  type ClientDto,
  type PaginationMeta,
  type Pagination,
  type ClientQuery,
  type UpdateClientInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { NotFoundError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { queryKey, readPublic } from '@/modules/content/public-cache.js';
import { publishChanges } from '@/modules/content/publish-changes.js';
import { reorderRows } from '@/modules/content/reorder.js';
import { ORDERED_TABLES } from '@/modules/content/reorder.repository.js';
import { paginate } from '@/utils/pagination.js';

import { toAdminClientDto, toClientDto } from './clients.mapper.js';
import { ClientRepository } from './clients.repository.js';

const repository = new ClientRepository();
const TAG = CACHE_TAGS.CLIENTS;
const changedTags = (id: string) => [TAG, entityTag(TAG, id)];

export function listPublicClients(
  query: Pagination,
): Promise<{ items: ClientDto[]; meta: PaginationMeta }> {
  return readPublic({
    key: queryKey('clients:list', query),
    tags: [TAG, CACHE_TAGS.MEDIA],
    load: async () => {
      const page = paginate(query);
      const { rows, total } = await repository.listVisible(page);
      return { items: rows.map(toClientDto), meta: page.toMeta(total) };
    },
  });
}

export async function listClients(
  query: ClientQuery,
): Promise<{ items: AdminClientDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await repository.list(query, page);
  return { items: rows.map(toAdminClientDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, source = repository) {
  const row = await source.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getClient(id: string): Promise<AdminClientDto> {
  return toAdminClientDto(await findOrFail(id));
}

export async function createClient(
  input: CreateClientInput,
  actor: Actor,
): Promise<AdminClientDto> {
  const created = await withTransaction(async (tx) => {
    const item = toAdminClientDto(await new ClientRepository(tx).create(input));
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.CLIENT,
      entityId: item.id,
      changes: input,
    });
    return item;
  });
  await publishChanges(changedTags(created.id));
  return created;
}

export async function updateClient(
  id: string,
  input: UpdateClientInput,
  actor: Actor,
): Promise<AdminClientDto> {
  const before = toAdminClientDto(await findOrFail(id));
  const updated = await withTransaction(async (tx) => {
    const after = toAdminClientDto(await new ClientRepository(tx).update(id, input));
    await auditWrite(tx, actor, {
      action: AuditAction.UPDATE,
      entity: AuditEntity.CLIENT,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges(changedTags(id));
  return updated;
}

export async function deleteClient(id: string, actor: Actor): Promise<void> {
  await withTransaction(async (tx) => {
    const source = new ClientRepository(tx);
    await findOrFail(id, source);
    await source.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.CLIENT,
      entityId: id,
    });
  });
  await publishChanges(changedTags(id));
}

export function reorderClients(ids: readonly string[], actor: Actor): Promise<number> {
  return reorderRows(ORDERED_TABLES.clients, AuditEntity.CLIENT, ids, actor, [TAG]);
}
