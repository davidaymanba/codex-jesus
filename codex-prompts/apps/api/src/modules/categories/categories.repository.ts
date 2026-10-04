import { PAGINATION, type CategoryQuery, type CategoryType } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { slugPrefixWhere, type SlugField, type SlugLookup } from '@/modules/content/slugs.js';
import { escapeLike } from '@/utils/like.js';
import { orderByOf } from '@/utils/sort.js';

export const CATEGORY_SELECT = {
  id: true,
  name: true,
  slugAr: true,
  slugEn: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CategorySelect;

export type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof CATEGORY_SELECT }>;

/** Localized-name search for admin lists (small tables: a sequential scan is fine). */
function searchWhere(q: string | undefined): Prisma.CategoryWhereInput {
  if (!q) return {};
  const term = escapeLike(q);
  return {
    OR: [
      { name: { path: ['ar'], string_contains: term, mode: 'insensitive' } },
      { name: { path: ['en'], string_contains: term, mode: 'insensitive' } },
      { slugEn: { contains: term, mode: 'insensitive' } },
    ],
  };
}

export class CategoryRepository extends BaseRepository implements SlugLookup {
  async list(query: CategoryQuery, page: { skip: number; take: number }) {
    const where: Prisma.CategoryWhereInput = {
      ...(query.type && { type: query.type }),
      ...searchWhere(query.q),
    };
    const [rows, total] = await Promise.all([
      this.db.category.findMany({
        where,
        select: CATEGORY_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.category.count({ where }),
    ]);
    return { rows, total };
  }

  /** The categories of a type, for public filters (a handful; capped like any list). */
  listAll(type: CategoryType | undefined): Promise<CategoryRow[]> {
    return this.db.category.findMany({
      where: type ? { type } : {},
      select: CATEGORY_SELECT,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: PAGINATION.MAX_PAGE_SIZE,
    });
  }

  findById(id: string): Promise<CategoryRow | null> {
    return this.db.category.findUnique({ where: { id }, select: CATEGORY_SELECT });
  }

  create(data: Prisma.CategoryCreateInput): Promise<CategoryRow> {
    return this.db.category.create({ data, select: CATEGORY_SELECT });
  }

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<CategoryRow> {
    return this.db.category.update({ where: { id }, data, select: CATEGORY_SELECT });
  }

  /**
   * How many posts and projects are filed under the category. The row stays locked until the
   * transaction ends: attaching content takes a key-share lock on it, so none can slip in.
   */
  async lockAndCountUsage(id: string): Promise<number> {
    await this.db.$executeRaw`SELECT 1 FROM categories WHERE id = ${id}::uuid FOR UPDATE`;
    const row = await this.db.category.findUnique({
      where: { id },
      select: { _count: { select: { posts: true, projects: true } } },
    });
    return row ? row._count.posts + row._count.projects : 0;
  }

  async delete(id: string): Promise<void> {
    await this.db.category.delete({ where: { id }, select: { id: true } });
  }

  async takenSlugs(field: SlugField, base: string, excludeId?: string): Promise<string[]> {
    const rows = await this.db.category.findMany({
      where: slugPrefixWhere(field, base, excludeId),
      select: { slugAr: true, slugEn: true },
    });
    return rows.map((row) => row[field]);
  }
}
