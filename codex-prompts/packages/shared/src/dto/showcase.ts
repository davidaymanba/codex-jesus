import { z } from 'zod';

import {
  localizedTextDtoSchema,
  mediaDtoSchema,
  socialLinkDtoSchema,
  timestampDtoSchema,
} from './common.js';
import { teamSchema } from '../enums/team.js';

export const testimonialDtoSchema = z.object({
  id: z.uuid(),
  clientName: z.string(),
  role: localizedTextDtoSchema,
  company: z.string().nullable(),
  photo: mediaDtoSchema.nullable(),
  quote: localizedTextDtoSchema,
  rating: z.int(),
  order: z.int(),
});

export const teamMemberDtoSchema = z.object({
  id: z.uuid(),
  name: localizedTextDtoSchema,
  role: localizedTextDtoSchema,
  team: teamSchema,
  photo: mediaDtoSchema.nullable(),
  bio: localizedTextDtoSchema,
  socials: z.array(socialLinkDtoSchema),
  order: z.int(),
});

export const clientDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  logo: mediaDtoSchema.nullable(),
  website: z.url().nullable(),
  order: z.int(),
});

const adminFields = {
  isVisible: z.boolean(),
  createdAt: timestampDtoSchema,
  updatedAt: timestampDtoSchema,
};

export const adminTestimonialDtoSchema = testimonialDtoSchema.extend({
  ...adminFields,
  photoId: z.uuid().nullable(),
});
export const adminTeamMemberDtoSchema = teamMemberDtoSchema.extend({
  ...adminFields,
  photoId: z.uuid().nullable(),
});
export const adminClientDtoSchema = clientDtoSchema.extend({
  ...adminFields,
  logoId: z.uuid().nullable(),
});

export type TestimonialDto = z.infer<typeof testimonialDtoSchema>;
export type TeamMemberDto = z.infer<typeof teamMemberDtoSchema>;
export type ClientDto = z.infer<typeof clientDtoSchema>;
export type AdminTestimonialDto = z.infer<typeof adminTestimonialDtoSchema>;
export type AdminTeamMemberDto = z.infer<typeof adminTeamMemberDtoSchema>;
export type AdminClientDto = z.infer<typeof adminClientDtoSchema>;
