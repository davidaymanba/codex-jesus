import { z } from 'zod';

import {
  localizedTextDtoSchema,
  mediaDtoSchema,
  socialLinkDtoSchema,
  timestampDtoSchema,
} from './common.js';
import { categoryTypeSchema } from '../enums/category-type.js';

const ctaLinkDtoSchema = z.object({ label: localizedTextDtoSchema, href: z.string() });

const homepageDtoSchema = z.object({
  hero: z.object({
    eyebrow: localizedTextDtoSchema,
    title: localizedTextDtoSchema,
    subtitle: localizedTextDtoSchema,
    primaryCta: ctaLinkDtoSchema,
    secondaryCta: ctaLinkDtoSchema.optional(),
  }),
  stats: z.array(
    z.object({ value: z.int(), suffix: z.string().optional(), label: localizedTextDtoSchema }),
  ),
  processSteps: z.array(
    z.object({ title: localizedTextDtoSchema, description: localizedTextDtoSchema }),
  ),
  cta: z.object({
    title: localizedTextDtoSchema,
    subtitle: localizedTextDtoSchema,
    button: ctaLinkDtoSchema,
  }),
});

/** Public site settings: company, contact, socials, default SEO and homepage content. */
export const siteSettingsDtoSchema = z.object({
  companyName: localizedTextDtoSchema,
  logo: mediaDtoSchema.nullable(),
  contact: z.object({
    phone: z.string(),
    email: z.string(),
    whatsapp: z.string().optional(),
    address: localizedTextDtoSchema,
  }),
  socials: z.array(socialLinkDtoSchema),
  defaultSeo: z.object({
    metaTitle: localizedTextDtoSchema,
    metaDescription: localizedTextDtoSchema,
  }),
  ogImage: mediaDtoSchema.nullable(),
  homepage: homepageDtoSchema,
  updatedAt: timestampDtoSchema,
});

/**
 * The admin also sees the picked featured project ids. They stay out of the public DTO: they
 * may point at drafts, and the site lists featured projects with `/public/projects?featured`.
 */
const adminHomepageDtoSchema = homepageDtoSchema.extend({
  featuredProjectIds: z.array(z.uuid()),
});

export const adminSiteSettingsDtoSchema = siteSettingsDtoSchema.extend({
  homepage: adminHomepageDtoSchema,
  logoId: z.uuid().nullable(),
  ogImageId: z.uuid().nullable(),
});

const sitemapEntryDtoSchema = z.object({
  slugAr: z.string(),
  slugEn: z.string(),
  updatedAt: timestampDtoSchema,
});

/** Everything the sitemap needs: published slugs with their last change. */
export const sitemapDataDtoSchema = z.object({
  services: z.array(sitemapEntryDtoSchema),
  projects: z.array(sitemapEntryDtoSchema),
  posts: z.array(sitemapEntryDtoSchema),
  categories: z.array(sitemapEntryDtoSchema.extend({ type: categoryTypeSchema })),
});

export type SiteSettingsDto = z.infer<typeof siteSettingsDtoSchema>;
export type AdminSiteSettingsDto = z.infer<typeof adminSiteSettingsDtoSchema>;
export type SitemapDataDto = z.infer<typeof sitemapDataDtoSchema>;
