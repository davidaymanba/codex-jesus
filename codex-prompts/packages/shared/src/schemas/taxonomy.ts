import { type z } from 'zod';

import { objectSchema, searchQuerySchema, slugArSchema, slugEnSchema } from './common.js';
import { createLocalizedStringSchema } from './localized-string.js';
import { createSortSchema, paginationSchema } from './pagination.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { categoryTypeSchema } from '../enums/category-type.js';

const taxonomyFields = {
  name: createLocalizedStringSchema({ max: FIELD_LIMITS.LABEL_MAX }),
  slugAr: slugArSchema.optional(),
  slugEn: slugEnSchema.optional(),
};

const taxonomySort = createSortSchema(['createdAt', 'updatedAt'], {
  sortBy: 'createdAt',
  sortOrder: 'asc',
}).shape;

export const createCategorySchema = objectSchema({ ...taxonomyFields, type: categoryTypeSchema });

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = paginationSchema
  .extend({ type: categoryTypeSchema.optional(), q: searchQuerySchema.optional() })
  .extend(taxonomySort);

export const createTagSchema = objectSchema(taxonomyFields);

export const updateTagSchema = createTagSchema.partial();

export const tagQuerySchema = paginationSchema
  .extend({ q: searchQuerySchema.optional() })
  .extend(taxonomySort);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagQuery = z.infer<typeof tagQuerySchema>;
