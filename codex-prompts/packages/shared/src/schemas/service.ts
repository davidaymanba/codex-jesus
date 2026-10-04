import { z } from 'zod';

import { arraySchema, displayOrderSchema, objectSchema } from './common.js';
import { publishableDefaults, publishableFields } from './content-fields.js';
import { createLocalizedStringSchema } from './localized-string.js';
import { createSortSchema, paginationSchema } from './pagination.js';
import { localizedRichTextSchema } from './rich-text.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { SERVICE_ICONS } from '../constants/service-icons.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { contentStatusSchema } from '../enums/content-status.js';
import { serviceCategorySchema } from '../enums/service-category.js';

const titleSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.TITLE_MAX });
const labelSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.LABEL_MAX });
const shortTextSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.SHORT_TEXT_MAX });
const longTextSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.LONG_TEXT_MAX });

/** A sub-service or benefit card: short title + one-line description. */
export const serviceItemSchema = objectSchema({ title: labelSchema, description: shortTextSchema });

export const serviceFaqSchema = objectSchema({ question: shortTextSchema, answer: longTextSchema });

const listOf = <TItem extends z.ZodType>(item: TItem) =>
  arraySchema(item).max(FIELD_LIMITS.LIST_MAX_ITEMS, { error: MSG.TOO_MANY_ITEMS });

const serviceFields = objectSchema({
  ...publishableFields,
  title: titleSchema,
  shortDescription: shortTextSchema,
  content: localizedRichTextSchema,
  icon: z.enum(SERVICE_ICONS, { error: MSG.INVALID_OPTION }),
  category: serviceCategorySchema,
  subServices: listOf(serviceItemSchema),
  benefits: listOf(serviceItemSchema),
  faqs: listOf(serviceFaqSchema),
  order: displayOrderSchema,
});

export const createServiceSchema = serviceFields.extend({
  ...publishableDefaults,
  subServices: serviceFields.shape.subServices.default([]),
  benefits: serviceFields.shape.benefits.default([]),
  faqs: serviceFields.shape.faqs.default([]),
  order: displayOrderSchema.default(0),
});

export const updateServiceSchema = serviceFields.partial();

export const serviceQuerySchema = paginationSchema
  .extend({
    status: contentStatusSchema.optional(),
    category: serviceCategorySchema.optional(),
  })
  .extend(
    createSortSchema(['order', 'createdAt', 'updatedAt'], { sortBy: 'order', sortOrder: 'asc' })
      .shape,
  );

export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type ServiceFaq = z.infer<typeof serviceFaqSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceQuery = z.infer<typeof serviceQuerySchema>;
