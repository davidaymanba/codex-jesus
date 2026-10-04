import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  entityTag,
  VALIDATION_MESSAGES as MSG,
  type AdminCategoryDto,
  type CategoryDto,
  type CategoryQuery,
  type CategoryType,
  type CreateCategoryInput,
  type PaginationMeta,
  type UpdateCategoryInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { ConflictError, NotFoundError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { readPublic } from '@/modules/content/public-cache.js';
import { publishChanges } from '@/modules/content/publish-changes.js';
import { slugsForCreate, slugsForUpdate } from '@/modules/content/slugs.js';
import { withoutUndefined } from '@/utils/objects.js';
import { paginate } from '@/utils/pagination.js';

import { toAdminCategoryDto, toCategoryDto } from './categories.mapper.js';
import { CategoryRepository } from './categories.repository.js';

const categories = new CategoryRepository();

// Categories are embedded in post and project DTOs and listed in the sitemap.
const changedTags = (id: string) => [
  CACHE_TAGS.CATEGORIES,
  entityTag(CACHE_TAGS.CATEGORIES, id),
  CACHE_TAGS.POSTS,
  CACHE_TAGS.PROJECTS,
  CACHE_TAGS.SITEMAP,
];

export function listPublicCategories(type: CategoryType | undefined): Promise<CategoryDto[]> {
  return readPublic({
    key: `categories:${type ?? 'all'}`,
    tags: [CACHE_TAGS.CATEGORIES],
    load: async () => (await categories.listAll(type)).map(toCategoryDto),
  });
}

export async function listCategories(
  query: CategoryQuery,
): Promise<{ items: AdminCategoryDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await categories.list(query, page);
  return { items: rows.map(toAdminCategoryDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, repository = categories) {
  const row = await repository.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getCategory(id: string): Promise<AdminCategoryDto> {
  return toAdminCategoryDto(await findOrFail(id));
}

export async function createCategory(
  input: CreateCategoryInput,
  actor: Actor,
): Promise<AdminCategoryDto> {
  const slugs = await slugsForCreate(categories, input.name, input);
  const created = await withTransaction(async (tx) => {
    const row = await new CategoryRepository(tx).create({
      name: input.name,
      type: input.type,
      ...slugs,
    });
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.CATEGORY,
      entityId: row.id,
      changes: { name: input.name, type: input.type, ...slugs },
    });
    return toAdminCategoryDto(row);
  });
  await publishChanges(changedTags(created.id));
  return created;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
  actor: Actor,
): Promise<AdminCategoryDto> {
  const before = toAdminCategoryDto(await findOrFail(id));
  const slugs = await slugsForUpdate(categories, id, input);
  const changesType = input.type !== undefined && input.type !== before.type;
  const updated = await withTransaction(async (tx) => {
    const repository = new CategoryRepository(tx);
    // Posts only take POST categories and projects PROJECT ones; a filed category keeps its type.
    if (changesType && (await repository.lockAndCountUsage(id)) > 0) {
      throw new ConflictError([{ path: 'type', message: MSG.CATEGORY_IN_USE }]);
    }
    const row = await repository.update(id, {
      ...withoutUndefined(input),
      ...slugs,
    });
    const after = toAdminCategoryDto(row);
    await auditWrite(tx, actor, {
      action: AuditAction.UPDATE,
      entity: AuditEntity.CATEGORY,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges(changedTags(id));
  return updated;
}

export async function deleteCategory(id: string, actor: Actor): Promise<void> {
  await withTransaction(async (tx) => {
    const repository = new CategoryRepository(tx);
    const row = await findOrFail(id, repository);
    await repository.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.CATEGORY,
      entityId: id,
      changes: { slugAr: row.slugAr, slugEn: row.slugEn },
    });
  });
  await publishChanges(changedTags(id));
}
