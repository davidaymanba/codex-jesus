import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  entityTag,
  VALIDATION_MESSAGES as MSG,
  type AdminProjectDto,
  type CreateProjectInput,
  type Locale,
  type PaginationMeta,
  type ProjectDto,
  type ProjectQuery,
  type ProjectSummaryDto,
  type PublicProjectQuery,
  type UpdateProjectInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { NotFoundError, ValidationError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { queryKey, readPublic } from '@/modules/content/public-cache.js';
import { resolvePublishedAt } from '@/modules/content/publication.js';
import { publishChanges } from '@/modules/content/publish-changes.js';
import { reorderRows } from '@/modules/content/reorder.js';
import { ORDERED_TABLES } from '@/modules/content/reorder.repository.js';
import { slugFieldOf, slugsForCreate, slugsForUpdate } from '@/modules/content/slugs.js';
import { paginate } from '@/utils/pagination.js';

import { toAdminProjectDto, toProjectDto, toProjectSummaryDto } from './projects.mapper.js';
import { ProjectRepository } from './projects.repository.js';

const projects = new ProjectRepository();
const READ_TAGS = [CACHE_TAGS.PROJECTS, CACHE_TAGS.CATEGORIES, CACHE_TAGS.MEDIA];
const changedTags = (id: string) => [
  CACHE_TAGS.PROJECTS,
  entityTag(CACHE_TAGS.PROJECTS, id),
  CACHE_TAGS.SITEMAP,
];
const nextChangeAt = () => projects.nextScheduledAt(new Date());

export function listPublicProjects(
  query: PublicProjectQuery,
): Promise<{ items: ProjectSummaryDto[]; meta: PaginationMeta }> {
  return readPublic({
    key: queryKey('projects:list', query),
    tags: READ_TAGS,
    nextChangeAt,
    load: async () => {
      const page = paginate(query);
      const { rows, total } = await projects.listPublished(query, page, new Date());
      return { items: rows.map(toProjectSummaryDto), meta: page.toMeta(total) };
    },
  });
}

export async function getPublicProject(slug: string, locale: Locale): Promise<ProjectDto> {
  const project = await readPublic({
    key: `projects:${locale}:${slug}`,
    tags: READ_TAGS,
    nextChangeAt,
    load: async () => {
      const row = await projects.findPublishedBySlug(slugFieldOf(locale), slug, new Date());
      return row ? toProjectDto(row) : null;
    },
  });
  if (!project) throw new NotFoundError();
  return project;
}

export async function listProjects(
  query: ProjectQuery,
): Promise<{ items: AdminProjectDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await projects.list(query, page);
  return { items: rows.map(toAdminProjectDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, repository = projects) {
  const row = await repository.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getProject(id: string): Promise<AdminProjectDto> {
  return toAdminProjectDto(await findOrFail(id));
}

/** Only project categories may be attached (post categories live on the blog). */
async function assertProjectCategories(ids: readonly string[] | undefined): Promise<void> {
  if (!ids || ids.length === 0) return;
  if ((await projects.countProjectCategories(ids)) !== ids.length) {
    throw new ValidationError([{ path: 'categoryIds', message: MSG.INVALID_ID }]);
  }
}

export async function createProject(
  input: CreateProjectInput,
  actor: Actor,
): Promise<AdminProjectDto> {
  await assertProjectCategories(input.categoryIds);
  const slugs = await slugsForCreate(projects, input.title, input);
  const { galleryIds, categoryIds, publishedAt, ...fields } = input;
  const relations = {
    galleryIds,
    categoryIds,
    publishedAt: resolvePublishedAt(input.status, publishedAt, null, new Date()) ?? null,
  };
  const created = await withTransaction(async (tx) => {
    const project = toAdminProjectDto(
      await new ProjectRepository(tx).create({ ...fields, ...slugs }, relations),
    );
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.PROJECT,
      entityId: project.id,
      changes: { ...input, ...slugs },
    });
    return project;
  });
  await publishChanges(changedTags(created.id));
  return created;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  actor: Actor,
): Promise<AdminProjectDto> {
  const row = await findOrFail(id);
  const before = toAdminProjectDto(row);
  await assertProjectCategories(input.categoryIds);
  const slugs = await slugsForUpdate(projects, id, input);
  const { galleryIds, categoryIds, publishedAt, ...fields } = input;
  const status = input.status ?? row.status;
  const relations = {
    ...(galleryIds && { galleryIds }),
    ...(categoryIds && { categoryIds }),
    publishedAt: resolvePublishedAt(status, publishedAt, row.publishedAt, new Date()),
  };
  const updated = await withTransaction(async (tx) => {
    const after = toAdminProjectDto(
      await new ProjectRepository(tx).update(id, { ...fields, ...slugs }, relations),
    );
    await auditWrite(tx, actor, {
      action: before.status === after.status ? AuditAction.UPDATE : AuditAction.STATUS_CHANGE,
      entity: AuditEntity.PROJECT,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges(changedTags(id));
  return updated;
}

export async function deleteProject(id: string, actor: Actor): Promise<void> {
  await withTransaction(async (tx) => {
    const repository = new ProjectRepository(tx);
    const row = await findOrFail(id, repository);
    await repository.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.PROJECT,
      entityId: id,
      changes: { slugAr: row.slugAr, slugEn: row.slugEn },
    });
  });
  await publishChanges(changedTags(id));
}

export function reorderProjects(ids: readonly string[], actor: Actor): Promise<number> {
  // Reordering moves updatedAt, which the sitemap lists as lastmod.
  return reorderRows(ORDERED_TABLES.projects, AuditEntity.PROJECT, ids, actor, [
    CACHE_TAGS.PROJECTS,
    CACHE_TAGS.SITEMAP,
  ]);
}
