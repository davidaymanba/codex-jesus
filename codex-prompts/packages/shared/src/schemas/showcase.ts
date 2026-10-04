import { type z } from 'zod';

import {
  booleanQuerySchema,
  boundedInt,
  httpUrlSchema,
  idSchema,
  objectSchema,
  personNameSchema,
  requiredString,
} from './common.js';
import { orderedVisibilityDefaults, orderedVisibilityFields } from './content-fields.js';
import { createLocalizedStringSchema } from './localized-string.js';
import { createSortSchema, paginationSchema } from './pagination.js';
import { socialLinksSchema } from './social-link.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { teamSchema } from '../enums/team.js';

const labelSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.LABEL_MAX });
const orderSort = createSortSchema(['order', 'createdAt'], {
  sortBy: 'order',
  sortOrder: 'asc',
}).shape;
const visibilityFilter = { isVisible: booleanQuerySchema.optional() };

// ─── Testimonials ─────────────────────────────────────────────────────────────

const testimonialFields = objectSchema({
  clientName: personNameSchema,
  role: labelSchema,
  company: requiredString({ max: FIELD_LIMITS.COMPANY_MAX }).nullable().optional(),
  photoId: idSchema.nullable().optional(),
  quote: createLocalizedStringSchema({ max: FIELD_LIMITS.QUOTE_MAX }),
  rating: boundedInt({ min: FIELD_LIMITS.RATING.MIN, max: FIELD_LIMITS.RATING.MAX }),
  ...orderedVisibilityFields,
});

export const createTestimonialSchema = testimonialFields.extend(orderedVisibilityDefaults);
export const updateTestimonialSchema = testimonialFields.partial();
export const testimonialQuerySchema = paginationSchema.extend(visibilityFilter).extend(orderSort);

// ─── Team members ─────────────────────────────────────────────────────────────

const teamMemberFields = objectSchema({
  name: labelSchema,
  role: labelSchema,
  team: teamSchema,
  photoId: idSchema.nullable().optional(),
  bio: createLocalizedStringSchema({ max: FIELD_LIMITS.BIO_MAX }),
  socials: socialLinksSchema,
  ...orderedVisibilityFields,
});

export const createTeamMemberSchema = teamMemberFields.extend({
  ...orderedVisibilityDefaults,
  socials: socialLinksSchema.default([]),
});
export const updateTeamMemberSchema = teamMemberFields.partial();
export const teamMemberQuerySchema = paginationSchema
  .extend({ ...visibilityFilter, team: teamSchema.optional() })
  .extend(orderSort);

// ─── Clients ──────────────────────────────────────────────────────────────────

const clientFields = objectSchema({
  name: requiredString({ max: FIELD_LIMITS.CLIENT_NAME_MAX }),
  logoId: idSchema.nullable().optional(),
  website: httpUrlSchema.nullable().optional(),
  ...orderedVisibilityFields,
});

export const createClientSchema = clientFields.extend(orderedVisibilityDefaults);
export const updateClientSchema = clientFields.partial();
export const clientQuerySchema = paginationSchema.extend(visibilityFilter).extend(orderSort);

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
export type TestimonialQuery = z.infer<typeof testimonialQuerySchema>;
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type TeamMemberQuery = z.infer<typeof teamMemberQuerySchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQuery = z.infer<typeof clientQuerySchema>;
