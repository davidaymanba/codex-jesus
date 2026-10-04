import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** Handling state of a contact form message. */
export const ContactStatus = {
  NEW: 'NEW',
  REPLIED: 'REPLIED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];

export const contactStatusSchema = z.enum(ContactStatus, {
  error: VALIDATION_MESSAGES.INVALID_OPTION,
});
