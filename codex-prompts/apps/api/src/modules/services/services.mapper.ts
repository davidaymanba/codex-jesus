import { z } from 'zod';

import {
  localizedRichTextDtoSchema,
  localizedTextDtoSchema,
  seoDtoSchema,
  type AdminServiceDto,
  type ServiceDto,
  type ServiceSummaryDto,
} from '@codex/shared';

import { parseJson } from '@/modules/content/json.js';
import { toOptionalMediaDto } from '@/modules/content/media-dto.js';

import type { ServiceRow, ServiceSummaryRow } from './services.repository.js';

const itemsSchema = z.array(
  z.object({ title: localizedTextDtoSchema, description: localizedTextDtoSchema }),
);
const faqsSchema = z.array(
  z.object({ question: localizedTextDtoSchema, answer: localizedTextDtoSchema }),
);

export function toServiceSummaryDto(row: ServiceSummaryRow): ServiceSummaryDto {
  return {
    id: row.id,
    slugAr: row.slugAr,
    slugEn: row.slugEn,
    title: parseJson(localizedTextDtoSchema, row.title),
    shortDescription: parseJson(localizedTextDtoSchema, row.shortDescription),
    icon: row.icon,
    category: row.category,
    order: row.order,
    cover: toOptionalMediaDto(row.cover),
  };
}

export function toServiceDto(row: ServiceRow): ServiceDto {
  return {
    ...toServiceSummaryDto(row),
    content: parseJson(localizedRichTextDtoSchema, row.content),
    subServices: parseJson(itemsSchema, row.subServices),
    benefits: parseJson(itemsSchema, row.benefits),
    faqs: parseJson(faqsSchema, row.faqs),
    seo: parseJson(seoDtoSchema, row.seo),
    ogImage: toOptionalMediaDto(row.ogImage),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminServiceDto(row: ServiceRow): AdminServiceDto {
  return {
    ...toServiceDto(row),
    status: row.status,
    coverId: row.coverId,
    ogImageId: row.ogImageId,
    createdAt: row.createdAt.toISOString(),
  };
}
