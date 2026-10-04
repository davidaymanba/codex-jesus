import { type z } from 'zod';

import {
  arraySchema,
  boundedInt,
  emailSchema,
  idSchema,
  internalPathSchema,
  objectSchema,
  phoneSchema,
  requiredString,
  uniqueArray,
} from './common.js';
import { createLocalizedStringSchema } from './localized-string.js';
import { defaultSeoSchema } from './seo.js';
import { socialLinksSchema } from './social-link.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';

const labelSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.LABEL_MAX });
const shortLabelSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.SHORT_LABEL_MAX });
const titleSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.TITLE_MAX });
const shortTextSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.SHORT_TEXT_MAX });

export const contactInfoSchema = objectSchema({
  phone: phoneSchema,
  email: emailSchema,
  whatsapp: phoneSchema.optional(),
  address: shortTextSchema,
});

/** Button label + site-relative target (locale prefix added by the UI). */
export const ctaLinkSchema = objectSchema({ label: shortLabelSchema, href: internalPathSchema });

export const homepageStatSchema = objectSchema({
  value: boundedInt({ min: 0, max: FIELD_LIMITS.STAT_VALUE_MAX }),
  /** e.g. "+" or "%". */
  suffix: requiredString({ max: FIELD_LIMITS.STAT_SUFFIX_MAX }).optional(),
  label: labelSchema,
});

export const processStepSchema = objectSchema({ title: labelSchema, description: shortTextSchema });

export const homepageContentSchema = objectSchema({
  hero: objectSchema({
    eyebrow: labelSchema,
    title: titleSchema,
    subtitle: shortTextSchema,
    primaryCta: ctaLinkSchema,
    secondaryCta: ctaLinkSchema.optional(),
  }),
  stats: arraySchema(homepageStatSchema).max(FIELD_LIMITS.HOMEPAGE_STATS_MAX, {
    error: MSG.TOO_MANY_ITEMS,
  }),
  processSteps: arraySchema(processStepSchema).max(FIELD_LIMITS.PROCESS_STEPS_MAX, {
    error: MSG.TOO_MANY_ITEMS,
  }),
  featuredProjectIds: uniqueArray(idSchema, { max: FIELD_LIMITS.FEATURED_PROJECTS_MAX }),
  cta: objectSchema({ title: titleSchema, subtitle: shortTextSchema, button: ctaLinkSchema }),
});

/** The singleton site settings document (used to create/replace it). */
export const siteSettingsSchema = objectSchema({
  companyName: labelSchema,
  logoId: idSchema.nullable().optional(),
  contact: contactInfoSchema,
  socials: socialLinksSchema,
  defaultSeo: defaultSeoSchema,
  /** Default social share image when a page has none. */
  ogImageId: idSchema.nullable().optional(),
  homepage: homepageContentSchema,
});

export const updateSiteSettingsSchema = siteSettingsSchema.partial();

export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type CtaLink = z.infer<typeof ctaLinkSchema>;
export type HomepageContent = z.infer<typeof homepageContentSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
