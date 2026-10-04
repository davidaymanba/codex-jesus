import { z } from 'zod';

import { localizedTextDtoSchema, slugsDtoSchema, timestampDtoSchema } from './common.js';
import { categoryTypeSchema } from '../enums/category-type.js';

export const tagDtoSchema = slugsDtoSchema.extend({
  id: z.uuid(),
  name: localizedTextDtoSchema,
});

export const categoryDtoSchema = tagDtoSchema.extend({ type: categoryTypeSchema });

const adminTimestamps = { createdAt: timestampDtoSchema, updatedAt: timestampDtoSchema };

export const adminTagDtoSchema = tagDtoSchema.extend(adminTimestamps);
export const adminCategoryDtoSchema = categoryDtoSchema.extend(adminTimestamps);

export type TagDto = z.infer<typeof tagDtoSchema>;
export type CategoryDto = z.infer<typeof categoryDtoSchema>;
export type AdminTagDto = z.infer<typeof adminTagDtoSchema>;
export type AdminCategoryDto = z.infer<typeof adminCategoryDtoSchema>;
