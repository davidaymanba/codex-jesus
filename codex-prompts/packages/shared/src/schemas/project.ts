import { z } from 'zod';

import {
  arraySchema,
  booleanQuerySchema,
  displayOrderSchema,
  idSchema,
  objectSchema,
  requiredString,
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
import { serviceCategorySchema } from '../enums/service-category.js';

/** A headline result, e.g. `{ metric: "Online sales", value: "+120%" }`. */
export const projectResultSchema = objectSchema({
  metric: createLocalizedStringSchema({ max: FIELD_LIMITS.LABEL_MAX }),
  value: createLocalizedStringSchema({ max: FIELD_LIMITS.SHORT_LABEL_MAX }),
});

const projectFields = objectSchema({
  ...publishableFields,
  title: createLocalizedStringSchema({ max: FIELD_LIMITS.TITLE_MAX }),
  client: requiredString({ max: FIELD_LIMITS.CLIENT_NAME_MAX }).nullable().optional(),
  industry: createLocalizedStringSchema({ max: FIELD_LIMITS.LABEL_MAX }),
  serviceCategory: serviceCategorySchema,
  /** Gallery order follows array order. */
  galleryIds: uniqueArray(idSchema, { max: FIELD_LIMITS.GALLERY_MAX_ITEMS }),
  challenge: localizedRichTextSchema,
  solution: localizedRichTextSchema,
  results: arraySchema(projectResultSchema).max(FIELD_LIMITS.LIST_MAX_ITEMS, {
    error: MSG.TOO_MANY_ITEMS,
  }),
  techStack: uniqueArray(requiredString({ max: FIELD_LIMITS.TECH_STACK.ITEM_MAX }), {
    max: FIELD_LIMITS.TECH_STACK.MAX_ITEMS,
  }),
  categoryIds: uniqueArray(idSchema, { max: FIELD_LIMITS.RELATION_MAX_ITEMS }),
  isFeatured: z.boolean({ error: MSG.INVALID_TYPE }),
  publishedAt: publishedAtSchema,
  order: displayOrderSchema,
});

export const createProjectSchema = projectFields.extend({
  ...publishableDefaults,
  galleryIds: projectFields.shape.galleryIds.default([]),
  results: projectFields.shape.results.default([]),
  techStack: projectFields.shape.techStack.default([]),
  categoryIds: projectFields.shape.categoryIds.default([]),
  isFeatured: projectFields.shape.isFeatured.default(false),
  order: displayOrderSchema.default(0),
});

export const updateProjectSchema = projectFields.partial();

export const projectQuerySchema = paginationSchema
  .extend({
    status: contentStatusSchema.optional(),
    /** Category slug in either locale. */
    category: anyLocaleSlugSchema.optional(),
    serviceCategory: serviceCategorySchema.optional(),
    isFeatured: booleanQuerySchema.optional(),
    q: searchQuerySchema.optional(),
  })
  .extend(
    createSortSchema(['order', 'publishedAt', 'createdAt'], { sortBy: 'order', sortOrder: 'asc' })
      .shape,
  );

export type ProjectResult = z.infer<typeof projectResultSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
