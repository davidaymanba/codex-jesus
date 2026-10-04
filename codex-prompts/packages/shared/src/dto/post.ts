import { z } from 'zod';

import {
  localizedRichTextDtoSchema,
  localizedTextDtoSchema,
  mediaDtoSchema,
  seoDtoSchema,
  slugsDtoSchema,
  timestampDtoSchema,
} from './common.js';
import { categoryDtoSchema, tagDtoSchema } from './taxonomy.js';
import { contentStatusSchema } from '../enums/content-status.js';

/** A blog card. The author is shown by name only (never the email). */
export const postSummaryDtoSchema = slugsDtoSchema.extend({
  id: z.uuid(),
  title: localizedTextDtoSchema,
  excerpt: localizedTextDtoSchema,
  cover: mediaDtoSchema.nullable(),
  readingTime: z.object({ ar: z.int(), en: z.int() }),
  isFeatured: z.boolean(),
  publishedAt: timestampDtoSchema.nullable(),
  author: z.object({ name: z.string() }),
  categories: z.array(categoryDtoSchema),
  tags: z.array(tagDtoSchema),
});

/** A blog article. */
export const postDtoSchema = postSummaryDtoSchema.extend({
  content: localizedRichTextDtoSchema,
  seo: seoDtoSchema,
  ogImage: mediaDtoSchema.nullable(),
  updatedAt: timestampDtoSchema,
});

export const adminPostDtoSchema = postDtoSchema.extend({
  status: contentStatusSchema,
  authorId: z.uuid(),
  coverId: z.uuid().nullable(),
  ogImageId: z.uuid().nullable(),
  categoryIds: z.array(z.uuid()),
  tagIds: z.array(z.uuid()),
  createdAt: timestampDtoSchema,
});

export type PostSummaryDto = z.infer<typeof postSummaryDtoSchema>;
export type PostDto = z.infer<typeof postDtoSchema>;
export type AdminPostDto = z.infer<typeof adminPostDtoSchema>;
