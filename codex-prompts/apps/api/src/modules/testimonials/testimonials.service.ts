import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  entityTag,
  type AdminTestimonialDto,
  type CreateTestimonialInput,
  type TestimonialDto,
  type PaginationMeta,
  type Pagination,
  type TestimonialQuery,
  type UpdateTestimonialInput,
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

import { toAdminTestimonialDto, toTestimonialDto } from './testimonials.mapper.js';
import { TestimonialRepository } from './testimonials.repository.js';

const repository = new TestimonialRepository();
const TAG = CACHE_TAGS.TESTIMONIALS;
const changedTags = (id: string) => [TAG, entityTag(TAG, id)];

export function listPublicTestimonials(
  query: Pagination,
): Promise<{ items: TestimonialDto[]; meta: PaginationMeta }> {
  return readPublic({
    key: queryKey('testimonials:list', query),
    tags: [TAG, CACHE_TAGS.MEDIA],
    load: async () => {
      const page = paginate(query);
      const { rows, total } = await repository.listVisible(page);
      return { items: rows.map(toTestimonialDto), meta: page.toMeta(total) };
    },
  });
}

export async function listTestimonials(
  query: TestimonialQuery,
): Promise<{ items: AdminTestimonialDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await repository.list(query, page);
  return { items: rows.map(toAdminTestimonialDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, source = repository) {
  const row = await source.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getTestimonial(id: string): Promise<AdminTestimonialDto> {
  return toAdminTestimonialDto(await findOrFail(id));
}

export async function createTestimonial(
  input: CreateTestimonialInput,
  actor: Actor,
): Promise<AdminTestimonialDto> {
  const created = await withTransaction(async (tx) => {
    const item = toAdminTestimonialDto(await new TestimonialRepository(tx).create(input));
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.TESTIMONIAL,
      entityId: item.id,
      changes: input,
    });
    return item;
  });
  await publishChanges(changedTags(created.id));
  return created;
}

export async function updateTestimonial(
  id: string,
  input: UpdateTestimonialInput,
  actor: Actor,
): Promise<AdminTestimonialDto> {
  const before = toAdminTestimonialDto(await findOrFail(id));
  const updated = await withTransaction(async (tx) => {
    const after = toAdminTestimonialDto(await new TestimonialRepository(tx).update(id, input));
    await auditWrite(tx, actor, {
      action: AuditAction.UPDATE,
      entity: AuditEntity.TESTIMONIAL,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges(changedTags(id));
  return updated;
}

export async function deleteTestimonial(id: string, actor: Actor): Promise<void> {
  await withTransaction(async (tx) => {
    const source = new TestimonialRepository(tx);
    await findOrFail(id, source);
    await source.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.TESTIMONIAL,
      entityId: id,
    });
  });
  await publishChanges(changedTags(id));
}

export function reorderTestimonials(ids: readonly string[], actor: Actor): Promise<number> {
  return reorderRows(ORDERED_TABLES.testimonials, AuditEntity.TESTIMONIAL, ids, actor, [TAG]);
}
