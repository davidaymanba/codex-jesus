import { type z } from 'zod';

import { arraySchema, httpUrlSchema, objectSchema } from './common.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { socialPlatformSchema } from '../enums/social-platform.js';

export const socialLinkSchema = objectSchema({
  platform: socialPlatformSchema,
  url: httpUrlSchema,
});

/** Social profile links, at most one per platform. */
export const socialLinksSchema = arraySchema(socialLinkSchema)
  .max(FIELD_LIMITS.SOCIALS_MAX_ITEMS, { error: MSG.TOO_MANY_ITEMS })
  .refine((links) => new Set(links.map((link) => link.platform)).size === links.length, {
    error: MSG.DUPLICATE_ITEMS,
  });

export type SocialLink = z.infer<typeof socialLinkSchema>;
