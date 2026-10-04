import { z } from 'zod';

import {
  localizedRichTextDtoSchema,
  localizedTextDtoSchema,
  seoDtoSchema,
  type AdminProjectDto,
  type ProjectDto,
  type ProjectSummaryDto,
} from '@codex/shared';

import { toCategoryDto } from '@/modules/categories/categories.mapper.js';
import { parseJson } from '@/modules/content/json.js';
import { toMediaDto, toOptionalMediaDto } from '@/modules/content/media-dto.js';

import type { ProjectRow, ProjectSummaryRow } from './projects.select.js';

const resultsSchema = z.array(
  z.object({ metric: localizedTextDtoSchema, value: localizedTextDtoSchema }),
);

export function toProjectSummaryDto(row: ProjectSummaryRow): ProjectSummaryDto {
  return {
    id: row.id,
    slugAr: row.slugAr,
    slugEn: row.slugEn,
    title: parseJson(localizedTextDtoSchema, row.title),
    client: row.client,
    industry: parseJson(localizedTextDtoSchema, row.industry),
    serviceCategory: row.serviceCategory,
    cover: toOptionalMediaDto(row.cover),
    isFeatured: row.isFeatured,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    categories: row.categories.map(toCategoryDto),
  };
}

export function toProjectDto(row: ProjectRow): ProjectDto {
  return {
    ...toProjectSummaryDto(row),
    challenge: parseJson(localizedRichTextDtoSchema, row.challenge),
    solution: parseJson(localizedRichTextDtoSchema, row.solution),
    results: parseJson(resultsSchema, row.results),
    techStack: row.techStack,
    gallery: row.gallery.map(({ media }) => toMediaDto(media)),
    seo: parseJson(seoDtoSchema, row.seo),
    ogImage: toOptionalMediaDto(row.ogImage),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminProjectDto(row: ProjectRow): AdminProjectDto {
  return {
    ...toProjectDto(row),
    status: row.status,
    order: row.order,
    coverId: row.coverId,
    ogImageId: row.ogImageId,
    galleryIds: row.gallery.map(({ media }) => media.id),
    categoryIds: row.categories.map(({ id }) => id),
    createdAt: row.createdAt.toISOString(),
  };
}
