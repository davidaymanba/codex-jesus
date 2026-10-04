import { z } from 'zod';

import {
  localizedRichTextDtoSchema,
  localizedTextDtoSchema,
  mediaDtoSchema,
  seoDtoSchema,
  slugsDtoSchema,
  timestampDtoSchema,
} from './common.js';
import { categoryDtoSchema } from './taxonomy.js';
import { contentStatusSchema } from '../enums/content-status.js';
import { serviceCategorySchema } from '../enums/service-category.js';

/** A portfolio card. */
export const projectSummaryDtoSchema = slugsDtoSchema.extend({
  id: z.uuid(),
  title: localizedTextDtoSchema,
  client: z.string().nullable(),
  industry: localizedTextDtoSchema,
  serviceCategory: serviceCategorySchema,
  cover: mediaDtoSchema.nullable(),
  isFeatured: z.boolean(),
  publishedAt: timestampDtoSchema.nullable(),
  categories: z.array(categoryDtoSchema),
});

/** A case study page. */
export const projectDtoSchema = projectSummaryDtoSchema.extend({
  challenge: localizedRichTextDtoSchema,
  solution: localizedRichTextDtoSchema,
  results: z.array(z.object({ metric: localizedTextDtoSchema, value: localizedTextDtoSchema })),
  techStack: z.array(z.string()),
  gallery: z.array(mediaDtoSchema),
  seo: seoDtoSchema,
  ogImage: mediaDtoSchema.nullable(),
  updatedAt: timestampDtoSchema,
});

export const adminProjectDtoSchema = projectDtoSchema.extend({
  status: contentStatusSchema,
  order: z.int(),
  coverId: z.uuid().nullable(),
  ogImageId: z.uuid().nullable(),
  galleryIds: z.array(z.uuid()),
  categoryIds: z.array(z.uuid()),
  createdAt: timestampDtoSchema,
});

export type ProjectSummaryDto = z.infer<typeof projectSummaryDtoSchema>;
export type ProjectDto = z.infer<typeof projectDtoSchema>;
export type AdminProjectDto = z.infer<typeof adminProjectDtoSchema>;
