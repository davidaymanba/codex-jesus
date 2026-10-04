import { z } from 'zod';

import {
  displayOrderSchema,
  idSchema,
  isoDateTimeSchema,
  slugArSchema,
  slugEnSchema,
} from './common.js';
import { seoSchema } from './seo.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { ContentStatus, contentStatusSchema } from '../enums/content-status.js';

/**
 * Fields shared by publishable content (services, projects, posts). Slugs are optional
 * because the API derives them from the title when omitted.
 */
export const publishableFields = {
  slugAr: slugArSchema.optional(),
  slugEn: slugEnSchema.optional(),
  status: contentStatusSchema,
  coverId: idSchema.nullable().optional(),
  ogImageId: idSchema.nullable().optional(),
  seo: seoSchema.nullable().optional(),
};

/** Defaults applied on create only, so partial updates never reset them. */
export const publishableDefaults = {
  status: contentStatusSchema.default(ContentStatus.DRAFT),
};

export const publishedAtSchema = isoDateTimeSchema.nullable().optional();

/** `order` + `isVisible` used by lists the admin arranges by hand. */
export const orderedVisibilityFields = {
  order: displayOrderSchema,
  isVisible: z.boolean({ error: MSG.INVALID_TYPE }),
};

export const orderedVisibilityDefaults = {
  order: displayOrderSchema.default(0),
  isVisible: z.boolean({ error: MSG.INVALID_TYPE }).default(true),
};
