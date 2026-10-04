import {
  CategoryType,
  ContentStatus,
  type CreatePostInput,
  type PostQuery,
  type UpdatePostInput,
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

import { POST_SELECT, POST_SUMMARY_SELECT, type PostRow } from './posts.select.js';

interface Page {
  skip: number;
  take: number;
}
type RelationKeys = 'categoryIds' | 'tagIds' | 'publishedAt';

/** Relations, publish time and computed fields, prepared by the service. */
export interface PostExtras {
  categoryIds?: string[];
  tagIds?: string[];
  /** `undefined` keeps the stored value. */
  publishedAt?: Date | null | undefined;
  readingTime?: { ar: number; en: number };
}

export interface PostFilters {
  category?: string | undefined;
  tag?: string | undefined;
  featured?: boolean | undefined;
  /** Already normalized with `normalizeSearchTerm`. */
  searchTerm?: string | undefined;
}

const connectAll = (ids: string[]) => ids.map((id) => ({ id }));
const bySlug = (slug: string) => ({ OR: [{ slugAr: slug }, { slugEn: slug }] });

function filtersWhere({ category, tag, featured, searchTerm }: PostFilters): Prisma.PostWhereInput {
  return {
    ...(category && { categories: { some: bySlug(category) } }),
    ...(tag && { tags: { some: bySlug(tag) } }),
    ...(featured !== undefined && { isFeatured: featured }),
    // Trigram-indexed (GIN gin_trgm_ops); Prisma binds and escapes the term.
    ...(searchTerm && { searchText: { contains: searchTerm } }),
  };
}

function readingTimeData(readingTime: PostExtras['readingTime']) {
  return readingTime ? { readingTimeAr: readingTime.ar, readingTimeEn: readingTime.en } : {};
}

export class PostRepository extends BaseRepository implements SlugLookup {
  private async page<TSelect extends Prisma.PostSelect>(
    where: Prisma.PostWhereInput,
    orderBy: Prisma.PostOrderByWithRelationInput[],
    page: Page,
    select: TSelect,
  ) {
    const [rows, total] = await Promise.all([
      this.db.post.findMany({ where, orderBy, select, skip: page.skip, take: page.take }),
      this.db.post.count({ where }),
    ]);
    return { rows, total };
  }

  /**
   * The search term normalized like the stored text (the trigger's SQL function), with LIKE
   * wildcards escaped: Prisma's `contains` passes `%` and `_` through as patterns.
   */
  async normalizeSearchTerm(q: string): Promise<string> {
    const [row] = await this.db.$queryRaw<{ term: string }[]>`
      SELECT codex_normalize_search(${q}) AS term`;
    return escapeLike(row?.term ?? q.toLowerCase());
  }

  list(query: PostQuery, filters: PostFilters, page: Page) {
    const where: Prisma.PostWhereInput = {
      ...(query.status && { status: query.status }),
      ...filtersWhere(filters),
    };
    return this.page(where, orderByOf(query.sortBy, query.sortOrder), page, POST_SELECT);
  }

  listPublished(filters: PostFilters, page: Page, now: Date) {
    const where = { ...publishedWhere(now), ...filtersWhere(filters) };
    return this.page(where, [{ publishedAt: 'desc' }, { id: 'desc' }], page, POST_SUMMARY_SELECT);
  }

  findPublishedBySlug(field: SlugField, slug: string, now: Date): Promise<PostRow | null> {
    const where = field === 'slugAr' ? { slugAr: slug } : { slugEn: slug };
    return this.db.post.findFirst({
      where: { ...where, ...publishedWhere(now) },
      select: POST_SELECT,
    });
  }

  /** Published posts sharing a category or tag with `post`, newest first. */
  findRelated(post: PostRow, limit: number, now: Date) {
    const categoryIds = post.categories.map(({ id }) => id);
    const tagIds = post.tags.map(({ id }) => id);
    return this.db.post.findMany({
      where: {
        ...publishedWhere(now),
        id: { not: post.id },
        OR: [
          { categories: { some: { id: { in: categoryIds } } } },
          { tags: { some: { id: { in: tagIds } } } },
        ],
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: POST_SUMMARY_SELECT,
    });
  }

  /** The newest published posts except `excludeIds`, to fill up related posts. */
  findLatest(excludeIds: string[], limit: number, now: Date) {
    return this.db.post.findMany({
      where: { ...publishedWhere(now), id: { notIn: excludeIds } },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: POST_SUMMARY_SELECT,
    });
  }

  async nextScheduledAt(now: Date): Promise<Date | null> {
    const next = await this.db.post.findFirst({
      where: { status: ContentStatus.PUBLISHED, publishedAt: { gt: now } },
      orderBy: { publishedAt: 'asc' },
      select: { publishedAt: true },
    });
    return next?.publishedAt ?? null;
  }

  findById(id: string): Promise<PostRow | null> {
    return this.db.post.findUnique({ where: { id }, select: POST_SELECT });
  }

  countPostCategories(ids: readonly string[]): Promise<number> {
    return this.db.category.count({ where: { id: { in: [...ids] }, type: CategoryType.POST } });
  }

  countTags(ids: readonly string[]): Promise<number> {
    return this.db.tag.count({ where: { id: { in: [...ids] } } });
  }

  create(
    fields: Omit<CreatePostInput, RelationKeys> & Slugs & { authorId: string },
    extras: PostExtras & Required<Pick<PostExtras, 'readingTime'>>,
  ): Promise<PostRow> {
    const { content, seo, coverId, ogImageId, ...rest } = fields;
    return this.db.post.create({
      data: {
        ...rest,
        content: toJsonInput(content),
        coverId: coverId ?? null,
        ogImageId: ogImageId ?? null,
        ...(seo !== undefined && { seo: toNullableJsonInput(seo) }),
        readingTimeAr: extras.readingTime.ar,
        readingTimeEn: extras.readingTime.en,
        publishedAt: extras.publishedAt ?? null,
        categories: { connect: connectAll(extras.categoryIds ?? []) },
        tags: { connect: connectAll(extras.tagIds ?? []) },
      },
      select: POST_SELECT,
    });
  }

  update(
    id: string,
    fields: Omit<UpdatePostInput, RelationKeys> & RequestedSlugs,
    extras: PostExtras,
  ): Promise<PostRow> {
    const { content, seo, ...rest } = withoutUndefined(fields);
    const { categoryIds, tagIds, publishedAt } = extras;
    return this.db.post.update({
      where: { id },
      data: {
        ...rest,
        ...(content && { content: toJsonInput(content) }),
        ...(seo !== undefined && { seo: toNullableJsonInput(seo) }),
        ...readingTimeData(extras.readingTime),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(categoryIds && { categories: { set: connectAll(categoryIds) } }),
        ...(tagIds && { tags: { set: connectAll(tagIds) } }),
      },
      select: POST_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.post.delete({ where: { id }, select: { id: true } });
  }

  async takenSlugs(field: SlugField, base: string, excludeId?: string): Promise<string[]> {
    const rows = await this.db.post.findMany({
      where: slugPrefixWhere(field, base, excludeId),
      select: { slugAr: true, slugEn: true },
    });
    return rows.map((row) => row[field]);
  }
}
