import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** Publishing state of services, projects and posts. */
export const ContentStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export const contentStatusSchema = z.enum(ContentStatus, {
  error: VALIDATION_MESSAGES.INVALID_OPTION,
});
