import {
  localizedTextDtoSchema,
  type AdminTestimonialDto,
  type TestimonialDto,
} from '@codex/shared';

import { parseJson } from '@/modules/content/json.js';
import { toOptionalMediaDto } from '@/modules/content/media-dto.js';

import type { TestimonialRow } from './testimonials.repository.js';

export function toTestimonialDto(row: TestimonialRow): TestimonialDto {
  return {
    id: row.id,
    clientName: row.clientName,
    company: row.company,
    rating: row.rating,
    role: parseJson(localizedTextDtoSchema, row.role),
    quote: parseJson(localizedTextDtoSchema, row.quote),
    photo: toOptionalMediaDto(row.photo),
    order: row.order,
  };
}

export function toAdminTestimonialDto(row: TestimonialRow): AdminTestimonialDto {
  return {
    ...toTestimonialDto(row),
    photoId: row.photoId,
    isVisible: row.isVisible,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
