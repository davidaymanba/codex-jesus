import {
  localizedRichTextDtoSchema,
  localizedTextDtoSchema,
  seoDtoSchema,
  type AdminPostDto,
  type PostDto,
  type PostSummaryDto,
} from '@codex/shared';

import { toCategoryDto } from '@/modules/categories/categories.mapper.js';
import { parseJson } from '@/modules/content/json.js';
import { toOptionalMediaDto } from '@/modules/content/media-dto.js';
import { toTagDto } from '@/modules/tags/tags.mapper.js';

import type { PostRow, PostSummaryRow } from './posts.select.js';

export function toPostSummaryDto(row: PostSummaryRow): PostSummaryDto {
  return {
    id: row.id,
    slugAr: row.slugAr,
    slugEn: row.slugEn,
    title: parseJson(localizedTextDtoSchema, row.title),
    excerpt: parseJson(localizedTextDtoSchema, row.excerpt),
    cover: toOptionalMediaDto(row.cover),
    readingTime: { ar: row.readingTimeAr, en: row.readingTimeEn },
    isFeatured: row.isFeatured,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    author: { name: row.author.name },
    categories: row.categories.map(toCategoryDto),
    tags: row.tags.map(toTagDto),
  };
}

export function toPostDto(row: PostRow): PostDto {
  return {
    ...toPostSummaryDto(row),
    content: parseJson(localizedRichTextDtoSchema, row.content),
    seo: parseJson(seoDtoSchema, row.seo),
    ogImage: toOptionalMediaDto(row.ogImage),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminPostDto(row: PostRow): AdminPostDto {
  return {
    ...toPostDto(row),
    status: row.status,
    authorId: row.authorId,
    coverId: row.coverId,
    ogImageId: row.ogImageId,
    categoryIds: row.categories.map(({ id }) => id),
    tagIds: row.tags.map(({ id }) => id),
    createdAt: row.createdAt.toISOString(),
  };
}
