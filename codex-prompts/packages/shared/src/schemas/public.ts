import { type z } from 'zod';

import {
  anyLocaleSlugSchema,
  booleanQuerySchema,
  idSchema,
  localeSchema,
  objectSchema,
  searchQuerySchema,
} from './common.js';
import { paginationSchema } from './pagination.js';
import { DEFAULT_LOCALE } from '../constants/locales.js';
import { categoryTypeSchema } from '../enums/category-type.js';
import { serviceCategorySchema } from '../enums/service-category.js';
import { teamSchema } from '../enums/team.js';

/** `/:id` route parameter. */
export const idParamsSchema = objectSchema({ id: idSchema });

/** `/:slug` route parameter of public detail pages (either locale's slug format). */
export const slugParamsSchema = objectSchema({ slug: anyLocaleSlugSchema });

/** Which locale's slug column `/:slug` is looked up in. */
export const localeQuerySchema = objectSchema({ locale: localeSchema.default(DEFAULT_LOCALE) });

export const publicProjectQuerySchema = paginationSchema.extend({
  /** Category slug in either locale. */
  category: anyLocaleSlugSchema.optional(),
  serviceCategory: serviceCategorySchema.optional(),
  featured: booleanQuerySchema.optional(),
});

export const publicPostQuerySchema = paginationSchema.extend({
  /** Category / tag slug in either locale. */
  category: anyLocaleSlugSchema.optional(),
  tag: anyLocaleSlugSchema.optional(),
  featured: booleanQuerySchema.optional(),
  q: searchQuerySchema.optional(),
});

export const publicCategoryQuerySchema = objectSchema({ type: categoryTypeSchema.optional() });

export type IdParams = z.infer<typeof idParamsSchema>;
export type SlugParams = z.infer<typeof slugParamsSchema>;
export type LocaleQuery = z.infer<typeof localeQuerySchema>;
export type PublicProjectQuery = z.infer<typeof publicProjectQuerySchema>;
export type PublicPostQuery = z.infer<typeof publicPostQuerySchema>;
export type PublicCategoryQuery = z.infer<typeof publicCategoryQuerySchema>;

export const publicTeamQuerySchema = paginationSchema.extend({ team: teamSchema.optional() });

export type PublicTeamQuery = z.infer<typeof publicTeamQuerySchema>;
