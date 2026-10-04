import { z } from 'zod';

import { emailSchema, objectSchema, requiredOrInvalidType } from './common.js';
import { passwordSchema } from './user.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { roleSchema } from '../enums/role.js';

/**
 * A password as typed at login: only bounded, never policy-checked, so a policy change can
 * never lock out existing accounts. Not trimmed.
 */
const enteredPasswordSchema = z
  .string({ error: requiredOrInvalidType })
  .min(1, { error: MSG.REQUIRED })
  .max(FIELD_LIMITS.PASSWORD.MAX, { error: MSG.TOO_LONG });

export const loginSchema = objectSchema({
  email: emailSchema,
  password: enteredPasswordSchema,
});

export const changePasswordSchema = objectSchema({
  currentPassword: enteredPasswordSchema,
  newPassword: passwordSchema,
}).refine(({ currentPassword, newPassword }) => currentPassword !== newPassword, {
  error: MSG.PASSWORD_UNCHANGED,
  path: ['newPassword'],
});

/** The signed-in user as returned by the API: safe fields only. */
export const authUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: roleSchema,
  lastLoginAt: z.iso.datetime({ offset: true }).nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
