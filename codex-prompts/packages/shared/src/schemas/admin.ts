import { type z } from 'zod';

import { idSchema, objectSchema, requiredString, uniqueArray } from './common.js';
import { passwordSchema } from './user.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';

/** The full desired order of an ordered list: ids first to last. */
export const reorderSchema = objectSchema({
  ids: uniqueArray(idSchema, { min: 1, max: FIELD_LIMITS.REORDER_MAX_ITEMS }),
});

/** Completes an emailed password reset. The token is the opaque value from the link. */
export const passwordResetConfirmSchema = objectSchema({
  token: requiredString({ max: FIELD_LIMITS.OPAQUE_TOKEN_MAX }),
  newPassword: passwordSchema,
});

export type ReorderInput = z.infer<typeof reorderSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
