import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** Which content a category groups. */
export const CategoryType = {
  POST: 'POST',
  PROJECT: 'PROJECT',
} as const;

export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const categoryTypeSchema = z.enum(CategoryType, {
  error: VALIDATION_MESSAGES.INVALID_OPTION,
});
