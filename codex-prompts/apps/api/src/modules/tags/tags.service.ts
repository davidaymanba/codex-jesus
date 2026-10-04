import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  entityTag,
  type AdminTagDto,
  type CreateTagInput,
  type PaginationMeta,
  type TagQuery,
  type UpdateTagInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { NotFoundError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { publishChanges } from '@/modules/content/publish-changes.js';
import { slugsForCreate, slugsForUpdate } from '@/modules/content/slugs.js';
import { withoutUndefined } from '@/utils/objects.js';
import { paginate } from '@/utils/pagination.js';

import { toAdminTagDto } from './tags.mapper.js';
import { TagRepository } from './tags.repository.js';

const tags = new TagRepository();

// Tags are embedded in post DTOs.
const changedTags = (id: string) => [
  CACHE_TAGS.TAGS,
  entityTag(CACHE_TAGS.TAGS, id),
  CACHE_TAGS.POSTS,
];

export async function listTags(
  query: TagQuery,
): Promise<{ items: AdminTagDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await tags.list(query, page);
  return { items: rows.map(toAdminTagDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, repository = tags) {
  const row = await repository.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getTag(id: string): Promise<AdminTagDto> {
  return toAdminTagDto(await findOrFail(id));
}

export async function createTag(input: CreateTagInput, actor: Actor): Promise<AdminTagDto> {
  const slugs = await slugsForCreate(tags, input.name, input);
  const created = await withTransaction(async (tx) => {
    const row = await new TagRepository(tx).create({ name: input.name, ...slugs });
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.TAG,
      entityId: row.id,
      changes: { name: input.name, ...slugs },
    });
    return toAdminTagDto(row);
  });
  await publishChanges(changedTags(created.id));
  return created;
}

export async function updateTag(
  id: string,
  input: UpdateTagInput,
  actor: Actor,
): Promise<AdminTagDto> {
  const before = toAdminTagDto(await findOrFail(id));
  const slugs = await slugsForUpdate(tags, id, input);
  const updated = await withTransaction(async (tx) => {
    const after = toAdminTagDto(
      await new TagRepository(tx).update(id, { ...withoutUndefined(input), ...slugs }),
    );
    await auditWrite(tx, actor, {
      action: AuditAction.UPDATE,
      entity: AuditEntity.TAG,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges(changedTags(id));
  return updated;
}

export async function deleteTag(id: string, actor: Actor): Promise<void> {
  await withTransaction(async (tx) => {
    const repository = new TagRepository(tx);
    const row = await findOrFail(id, repository);
    await repository.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.TAG,
      entityId: id,
      changes: { slugAr: row.slugAr, slugEn: row.slugEn },
    });
  });
  await publishChanges(changedTags(id));
}
