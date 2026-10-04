import type { TagQuery } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { slugPrefixWhere, type SlugField, type SlugLookup } from '@/modules/content/slugs.js';
import { escapeLike } from '@/utils/like.js';
import { orderByOf } from '@/utils/sort.js';

export const TAG_SELECT = {
  id: true,
  name: true,
  slugAr: true,
  slugEn: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.TagSelect;

export type TagRow = Prisma.TagGetPayload<{ select: typeof TAG_SELECT }>;

function searchWhere(q: string | undefined): Prisma.TagWhereInput {
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

export class TagRepository extends BaseRepository implements SlugLookup {
  async list(query: TagQuery, page: { skip: number; take: number }) {
    const where = searchWhere(query.q);
    const [rows, total] = await Promise.all([
      this.db.tag.findMany({
        where,
        select: TAG_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.tag.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<TagRow | null> {
    return this.db.tag.findUnique({ where: { id }, select: TAG_SELECT });
  }

  create(data: Prisma.TagCreateInput): Promise<TagRow> {
    return this.db.tag.create({ data, select: TAG_SELECT });
  }

  update(id: string, data: Prisma.TagUpdateInput): Promise<TagRow> {
    return this.db.tag.update({ where: { id }, data, select: TAG_SELECT });
  }

  async delete(id: string): Promise<void> {
    await this.db.tag.delete({ where: { id }, select: { id: true } });
  }

  async takenSlugs(field: SlugField, base: string, excludeId?: string): Promise<string[]> {
    const rows = await this.db.tag.findMany({
      where: slugPrefixWhere(field, base, excludeId),
      select: { slugAr: true, slugEn: true },
    });
    return rows.map((row) => row[field]);
  }
}
