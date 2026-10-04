import { type z } from 'zod';

import { objectSchema } from './common.js';
import { createLocalizedStringSchema } from './localized-string.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';

const seoTitleSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.SEO_TITLE_MAX });
const seoDescriptionSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.SEO_DESCRIPTION_MAX });

/**
 * Per-page SEO text overrides; anything omitted falls back to the page content or site defaults.
 * The OG image is a separate `ogImageId` column so the database can refuse to delete media in use.
 */
export const seoSchema = objectSchema({
  metaTitle: seoTitleSchema.optional(),
  metaDescription: seoDescriptionSchema.optional(),
});

export type Seo = z.infer<typeof seoSchema>;

/** Site-wide SEO defaults: title and description are mandatory. */
export const defaultSeoSchema = seoSchema.extend({
  metaTitle: seoTitleSchema,
  metaDescription: seoDescriptionSchema,
});

export type DefaultSeo = z.infer<typeof defaultSeoSchema>;
