import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  entityTag,
  type AdminTeamMemberDto,
  type CreateTeamMemberInput,
  type TeamMemberDto,
  type PaginationMeta,
  type PublicTeamQuery,
  type TeamMemberQuery,
  type UpdateTeamMemberInput,
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

import { toAdminTeamMemberDto, toTeamMemberDto } from './team.mapper.js';
import { TeamMemberRepository } from './team.repository.js';

const repository = new TeamMemberRepository();
const TAG = CACHE_TAGS.TEAM;
const changedTags = (id: string) => [TAG, entityTag(TAG, id)];

export function listPublicTeamMembers(
  query: PublicTeamQuery,
): Promise<{ items: TeamMemberDto[]; meta: PaginationMeta }> {
  return readPublic({
    key: queryKey('team:list', query),
    tags: [TAG, CACHE_TAGS.MEDIA],
    load: async () => {
      const page = paginate(query);
      const { rows, total } = await repository.listVisible(query, page);
      return { items: rows.map(toTeamMemberDto), meta: page.toMeta(total) };
    },
  });
}

export async function listTeamMembers(
  query: TeamMemberQuery,
): Promise<{ items: AdminTeamMemberDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await repository.list(query, page);
  return { items: rows.map(toAdminTeamMemberDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, source = repository) {
  const row = await source.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getTeamMember(id: string): Promise<AdminTeamMemberDto> {
  return toAdminTeamMemberDto(await findOrFail(id));
}

export async function createTeamMember(
  input: CreateTeamMemberInput,
  actor: Actor,
): Promise<AdminTeamMemberDto> {
  const created = await withTransaction(async (tx) => {
    const item = toAdminTeamMemberDto(await new TeamMemberRepository(tx).create(input));
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.TEAM_MEMBER,
      entityId: item.id,
      changes: input,
    });
    return item;
  });
  await publishChanges(changedTags(created.id));
  return created;
}

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput,
  actor: Actor,
): Promise<AdminTeamMemberDto> {
  const before = toAdminTeamMemberDto(await findOrFail(id));
  const updated = await withTransaction(async (tx) => {
    const after = toAdminTeamMemberDto(await new TeamMemberRepository(tx).update(id, input));
    await auditWrite(tx, actor, {
      action: AuditAction.UPDATE,
      entity: AuditEntity.TEAM_MEMBER,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges(changedTags(id));
  return updated;
}

export async function deleteTeamMember(id: string, actor: Actor): Promise<void> {
  await withTransaction(async (tx) => {
    const source = new TeamMemberRepository(tx);
    await findOrFail(id, source);
    await source.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.TEAM_MEMBER,
      entityId: id,
    });
  });
  await publishChanges(changedTags(id));
}

export function reorderTeamMembers(ids: readonly string[], actor: Actor): Promise<number> {
  return reorderRows(ORDERED_TABLES.teamMembers, AuditEntity.TEAM_MEMBER, ids, actor, [TAG]);
}
