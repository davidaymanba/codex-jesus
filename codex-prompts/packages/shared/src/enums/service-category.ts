import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** The three Codex service pillars. */
export const ServiceCategory = {
  DEVELOPMENT: 'DEVELOPMENT',
  BRANDING: 'BRANDING',
  MARKETING: 'MARKETING',
} as const;

export type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory];

export const serviceCategorySchema = z.enum(ServiceCategory, {
  error: VALIDATION_MESSAGES.INVALID_OPTION,
});
