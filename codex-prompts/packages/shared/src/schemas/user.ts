import { z } from 'zod';

import {
  booleanQuerySchema,
  emailSchema,
  objectSchema,
  personNameSchema,
  requiredOrInvalidType,
  searchQuerySchema,
} from './common.js';
import { createSortSchema, paginationSchema } from './pagination.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { Role, roleSchema } from '../enums/role.js';

const MIN_EMAIL_LOCAL_PART_LENGTH = 3;

/**
 * Password policy shared with forms: 12–128 characters, not trimmed (whitespace is part of the
 * secret). No composition rules (NIST SP 800-63B): the API additionally rejects guessable
 * passwords with a common-password dictionary and pattern scoring, which is too heavy to ship
 * to the browser.
 */
export const passwordSchema = z
  .string({ error: requiredOrInvalidType })
  .min(FIELD_LIMITS.PASSWORD.MIN, { error: MSG.PASSWORD_TOO_SHORT })
  .max(FIELD_LIMITS.PASSWORD.MAX, { error: MSG.TOO_LONG });

/** True when the password contains the email's local part (e.g. "sara" in sara@codex.co). */
export function isPasswordRelatedToEmail(password: string, email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase() ?? '';
  return (
    localPart.length >= MIN_EMAIL_LOCAL_PART_LENGTH && password.toLowerCase().includes(localPart)
  );
}

export const createUserSchema = objectSchema({
  name: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema.default(Role.EDITOR),
  isActive: z.boolean({ error: MSG.INVALID_TYPE }).default(true),
}).refine(({ password, email }) => !isPasswordRelatedToEmail(password, email), {
  error: MSG.PASSWORD_CONTAINS_EMAIL,
  path: ['password'],
});

/** Profile and access changes. Password changes go through the auth flow (Phase 2). */
export const updateUserSchema = objectSchema({
  name: personNameSchema,
  email: emailSchema,
  role: roleSchema,
  isActive: z.boolean({ error: MSG.INVALID_TYPE }),
}).partial();

export const userQuerySchema = paginationSchema
  .extend({
    role: roleSchema.optional(),
    isActive: booleanQuerySchema.optional(),
    q: searchQuerySchema.optional(),
  })
  .extend(
    createSortSchema(['createdAt', 'name', 'lastLoginAt'], {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }).shape,
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
