import { z } from 'zod';

import {
  booleanQuerySchema,
  idSchema,
  objectSchema,
  searchQuerySchema,
  anyLocaleSlugSchema,
  uniqueArray,
} from './common.js';
import { publishableDefaults, publishableFields, publishedAtSchema } from './content-fields.js';
import { createLocalizedStringSchema } from './localized-string.js';
import { createSortSchema, paginationSchema } from './pagination.js';
import { localizedRichTextSchema } from './rich-text.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { contentStatusSchema } from '../enums/content-status.js';

/** Author comes from the session and reading time is computed on save, so neither is input. */
const postFields = objectSchema({
  ...publishableFields,
  title: createLocalizedStringSchema({ max: FIELD_LIMITS.TITLE_MAX }),
  excerpt: createLocalizedStringSchema({ max: FIELD_LIMITS.SHORT_TEXT_MAX }),
  content: localizedRichTextSchema,
  categoryIds: uniqueArray(idSchema, { max: FIELD_LIMITS.RELATION_MAX_ITEMS }),
  tagIds: uniqueArray(idSchema, { max: FIELD_LIMITS.RELATION_MAX_ITEMS }),
  isFeatured: z.boolean({ error: MSG.INVALID_TYPE }),
  publishedAt: publishedAtSchema,
});

export const createPostSchema = postFields.extend({
  ...publishableDefaults,
  categoryIds: postFields.shape.categoryIds.default([]),
  tagIds: postFields.shape.tagIds.default([]),
  isFeatured: postFields.shape.isFeatured.default(false),
});

export const updatePostSchema = postFields.partial();

export const postQuerySchema = paginationSchema
  .extend({
    status: contentStatusSchema.optional(),
    /** Category / tag slug in either locale. */
    category: anyLocaleSlugSchema.optional(),
    tag: anyLocaleSlugSchema.optional(),
    isFeatured: booleanQuerySchema.optional(),
    q: searchQuerySchema.optional(),
  })
  .extend(
    createSortSchema(['publishedAt', 'createdAt', 'updatedAt'], {
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    }).shape,
  );

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostQuery = z.infer<typeof postQuerySchema>;
