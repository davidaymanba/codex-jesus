import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** Admin dashboard roles. ADMIN manages everything; EDITOR manages content and leads. */
export const Role = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const roleSchema = z.enum(Role, { error: VALIDATION_MESSAGES.INVALID_OPTION });
