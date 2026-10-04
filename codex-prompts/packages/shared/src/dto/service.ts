import { z } from 'zod';

import {
  localizedRichTextDtoSchema,
  localizedTextDtoSchema,
  mediaDtoSchema,
  seoDtoSchema,
  slugsDtoSchema,
  timestampDtoSchema,
} from './common.js';
import { contentStatusSchema } from '../enums/content-status.js';
import { serviceCategorySchema } from '../enums/service-category.js';

const serviceItemDtoSchema = z.object({
  title: localizedTextDtoSchema,
  description: localizedTextDtoSchema,
});

const serviceFaqDtoSchema = z.object({
  question: localizedTextDtoSchema,
  answer: localizedTextDtoSchema,
});

/** A service card (lists, navigation). */
export const serviceSummaryDtoSchema = slugsDtoSchema.extend({
  id: z.uuid(),
  title: localizedTextDtoSchema,
  shortDescription: localizedTextDtoSchema,
  icon: z.string(),
  category: serviceCategorySchema,
  order: z.int(),
  cover: mediaDtoSchema.nullable(),
});

/** A service page. */
export const serviceDtoSchema = serviceSummaryDtoSchema.extend({
  content: localizedRichTextDtoSchema,
  subServices: z.array(serviceItemDtoSchema),
  benefits: z.array(serviceItemDtoSchema),
  faqs: z.array(serviceFaqDtoSchema),
  seo: seoDtoSchema,
  ogImage: mediaDtoSchema.nullable(),
  updatedAt: timestampDtoSchema,
});

export const adminServiceDtoSchema = serviceDtoSchema.extend({
  status: contentStatusSchema,
  coverId: z.uuid().nullable(),
  ogImageId: z.uuid().nullable(),
  createdAt: timestampDtoSchema,
});

export type ServiceSummaryDto = z.infer<typeof serviceSummaryDtoSchema>;
export type ServiceDto = z.infer<typeof serviceDtoSchema>;
export type AdminServiceDto = z.infer<typeof adminServiceDtoSchema>;
