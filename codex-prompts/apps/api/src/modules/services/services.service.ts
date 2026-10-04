import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  entityTag,
  type AdminServiceDto,
  type CreateServiceInput,
  type Locale,
  type Pagination,
  type PaginationMeta,
  type ServiceDto,
  type ServiceQuery,
  type ServiceSummaryDto,
  type UpdateServiceInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { NotFoundError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { readPublic } from '@/modules/content/public-cache.js';
import { publishChanges } from '@/modules/content/publish-changes.js';
import { reorderRows } from '@/modules/content/reorder.js';
import { ORDERED_TABLES } from '@/modules/content/reorder.repository.js';
import { slugFieldOf, slugsForCreate, slugsForUpdate } from '@/modules/content/slugs.js';
import { paginate } from '@/utils/pagination.js';

import { toAdminServiceDto, toServiceDto, toServiceSummaryDto } from './services.mapper.js';
import { ServiceRepository } from './services.repository.js';

const services = new ServiceRepository();
const READ_TAGS = [CACHE_TAGS.SERVICES, CACHE_TAGS.MEDIA];
const changedTags = (id: string) => [
  CACHE_TAGS.SERVICES,
  entityTag(CACHE_TAGS.SERVICES, id),
  CACHE_TAGS.SITEMAP,
];

export function listPublicServices(
  query: Pagination,
): Promise<{ items: ServiceSummaryDto[]; meta: PaginationMeta }> {
  return readPublic({
    key: `services:list:${query.page}:${query.pageSize}`,
    tags: READ_TAGS,
    load: async () => {
      const page = paginate(query);
      const { rows, total } = await services.listPublished(page);
      return { items: rows.map(toServiceSummaryDto), meta: page.toMeta(total) };
    },
  });
}

export async function getPublicService(slug: string, locale: Locale): Promise<ServiceDto> {
  const service = await readPublic({
    key: `services:${locale}:${slug}`,
    tags: READ_TAGS,
    load: async () => {
      const row = await services.findPublishedBySlug(slugFieldOf(locale), slug);
      return row ? toServiceDto(row) : null;
    },
  });
  if (!service) throw new NotFoundError();
  return service;
}

export async function listServices(
  query: ServiceQuery,
): Promise<{ items: AdminServiceDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await services.list(query, page);
  return { items: rows.map(toAdminServiceDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, repository = services) {
  const row = await repository.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getService(id: string): Promise<AdminServiceDto> {
  return toAdminServiceDto(await findOrFail(id));
}

export async function createService(
  input: CreateServiceInput,
  actor: Actor,
): Promise<AdminServiceDto> {
  const slugs = await slugsForCreate(services, input.title, input);
  const created = await withTransaction(async (tx) => {
    const service = toAdminServiceDto(
      await new ServiceRepository(tx).create({ ...input, ...slugs }),
    );
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.SERVICE,
      entityId: service.id,
      changes: { ...input, ...slugs },
    });
    return service;
  });
  await publishChanges(changedTags(created.id));
  return created;
}

export async function updateService(
  id: string,
  input: UpdateServiceInput,
  actor: Actor,
): Promise<AdminServiceDto> {
  const before = toAdminServiceDto(await findOrFail(id));
  const slugs = await slugsForUpdate(services, id, input);
  const updated = await withTransaction(async (tx) => {
    const after = toAdminServiceDto(
      await new ServiceRepository(tx).update(id, { ...input, ...slugs }),
    );
    await auditWrite(tx, actor, {
      action: before.status === after.status ? AuditAction.UPDATE : AuditAction.STATUS_CHANGE,
      entity: AuditEntity.SERVICE,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges(changedTags(id));
  return updated;
}

export async function deleteService(id: string, actor: Actor): Promise<void> {
  await withTransaction(async (tx) => {
    const repository = new ServiceRepository(tx);
    const row = await findOrFail(id, repository);
    await repository.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.SERVICE,
      entityId: id,
      changes: { slugAr: row.slugAr, slugEn: row.slugEn },
    });
  });
  await publishChanges(changedTags(id));
}

export function reorderServices(ids: readonly string[], actor: Actor): Promise<number> {
  // Reordering moves updatedAt, which the sitemap lists as lastmod.
  return reorderRows(ORDERED_TABLES.services, AuditEntity.SERVICE, ids, actor, [
    CACHE_TAGS.SERVICES,
    CACHE_TAGS.SITEMAP,
  ]);
}
