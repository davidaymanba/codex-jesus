import {
  CategoryType,
  ContentStatus,
  type CreateProjectInput,
  type ProjectQuery,
  type PublicProjectQuery,
  type UpdateProjectInput,
} from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { toJsonInput, toNullableJsonInput } from '@/lib/prisma-json.js';
import { publishedWhere } from '@/modules/content/publication.js';
import {
  slugPrefixWhere,
  type RequestedSlugs,
  type SlugField,
  type SlugLookup,
  type Slugs,
} from '@/modules/content/slugs.js';
import { escapeLike } from '@/utils/like.js';
import { withoutUndefined } from '@/utils/objects.js';
import { orderByOf } from '@/utils/sort.js';

import {
  PROJECT_SELECT,
  PROJECT_SUMMARY_SELECT,
  type ProjectRow,
  type ProjectSummaryRow,
} from './projects.select.js';

interface Page {
  skip: number;
  take: number;
}
type RelationKeys = 'galleryIds' | 'categoryIds' | 'publishedAt';
type ProjectFields = Omit<CreateProjectInput, RelationKeys>;
type ProjectFieldChanges = Omit<UpdateProjectInput, RelationKeys> & RequestedSlugs;
/** Relations and the resolved publish time, prepared by the service. */
export interface ProjectRelations {
  galleryIds?: string[];
  categoryIds?: string[];
  /** `undefined` keeps the stored value. */
  publishedAt?: Date | null | undefined;
}

const galleryOf = (ids: string[]) => ids.map((mediaId, order) => ({ mediaId, order }));
const connectAll = (ids: string[]) => ids.map((id) => ({ id }));

/** Category filter by slug in either locale. */
function categoryWhere(slug: string | undefined): Prisma.ProjectWhereInput {
  if (!slug) return {};
  return { categories: { some: { OR: [{ slugAr: slug }, { slugEn: slug }] } } };
}

function searchWhere(q: string | undefined): Prisma.ProjectWhereInput {
  if (!q) return {};
  const term = escapeLike(q);
  return {
    OR: [
      { title: { path: ['ar'], string_contains: term, mode: 'insensitive' } },
      { title: { path: ['en'], string_contains: term, mode: 'insensitive' } },
      { client: { contains: term, mode: 'insensitive' } },
    ],
  };
}

export class ProjectRepository extends BaseRepository implements SlugLookup {
  private async page<TSelect extends Prisma.ProjectSelect>(
    where: Prisma.ProjectWhereInput,
    orderBy: Prisma.ProjectOrderByWithRelationInput[],
    page: Page,
    select: TSelect,
  ) {
    const [rows, total] = await Promise.all([
      this.db.project.findMany({ where, orderBy, select, skip: page.skip, take: page.take }),
      this.db.project.count({ where }),
    ]);
    return { rows, total };
  }

  list(query: ProjectQuery, page: Page) {
    const where: Prisma.ProjectWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.serviceCategory && { serviceCategory: query.serviceCategory }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...categoryWhere(query.category),
      ...searchWhere(query.q),
    };
    return this.page(where, orderByOf(query.sortBy, query.sortOrder), page, PROJECT_SELECT);
  }

  listPublished(query: PublicProjectQuery, page: Page, now: Date) {
    const where: Prisma.ProjectWhereInput = {
      ...publishedWhere(now),
      ...(query.serviceCategory && { serviceCategory: query.serviceCategory }),
      ...(query.featured !== undefined && { isFeatured: query.featured }),
      ...categoryWhere(query.category),
    };
    const orderBy = [{ order: 'asc' }, { publishedAt: 'desc' }, { id: 'asc' }] as const;
    return this.page(where, [...orderBy], page, PROJECT_SUMMARY_SELECT);
  }

  findPublishedBySlug(field: SlugField, slug: string, now: Date): Promise<ProjectRow | null> {
    const bySlug = field === 'slugAr' ? { slugAr: slug } : { slugEn: slug };
    return this.db.project.findFirst({
      where: { ...bySlug, ...publishedWhere(now) },
      select: PROJECT_SELECT,
    });
  }

  /** The next scheduled publish time, if any: public caches must expire by then. */
  async nextScheduledAt(now: Date): Promise<Date | null> {
    const next = await this.db.project.findFirst({
      where: { status: ContentStatus.PUBLISHED, publishedAt: { gt: now } },
      orderBy: { publishedAt: 'asc' },
      select: { publishedAt: true },
    });
    return next?.publishedAt ?? null;
  }

  findById(id: string): Promise<ProjectRow | null> {
    return this.db.project.findUnique({ where: { id }, select: PROJECT_SELECT });
  }

  /** How many of `ids` are project categories (the rest are unknown or post categories). */
  countProjectCategories(ids: readonly string[]): Promise<number> {
    return this.db.category.count({ where: { id: { in: [...ids] }, type: CategoryType.PROJECT } });
  }

  create(fields: ProjectFields & Slugs, relations: ProjectRelations): Promise<ProjectRow> {
    const { challenge, solution, seo, client, coverId, ogImageId, ...rest } = fields;
    return this.db.project.create({
      data: {
        ...rest,
        client: client ?? null,
        challenge: toJsonInput(challenge),
        solution: toJsonInput(solution),
        coverId: coverId ?? null,
        ogImageId: ogImageId ?? null,
        ...(seo !== undefined && { seo: toNullableJsonInput(seo) }),
        publishedAt: relations.publishedAt ?? null,
        gallery: { create: galleryOf(relations.galleryIds ?? []) },
        categories: { connect: connectAll(relations.categoryIds ?? []) },
      },
      select: PROJECT_SELECT,
    });
  }

  update(
    id: string,
    fields: ProjectFieldChanges,
    relations: ProjectRelations,
  ): Promise<ProjectRow> {
    const { challenge, solution, seo, ...rest } = withoutUndefined(fields);
    const { galleryIds, categoryIds, publishedAt } = relations;
    return this.db.project.update({
      where: { id },
      data: {
        ...rest,
        ...(challenge && { challenge: toJsonInput(challenge) }),
        ...(solution && { solution: toJsonInput(solution) }),
        ...(seo !== undefined && { seo: toNullableJsonInput(seo) }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(galleryIds && { gallery: { deleteMany: {}, create: galleryOf(galleryIds) } }),
        ...(categoryIds && { categories: { set: connectAll(categoryIds) } }),
      },
      select: PROJECT_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.project.delete({ where: { id }, select: { id: true } });
  }

  async takenSlugs(field: SlugField, base: string, excludeId?: string): Promise<string[]> {
    const rows = await this.db.project.findMany({
      where: slugPrefixWhere(field, base, excludeId),
      select: { slugAr: true, slugEn: true },
    });
    return rows.map((row) => row[field]);
  }
}

export type { ProjectRow, ProjectSummaryRow };
