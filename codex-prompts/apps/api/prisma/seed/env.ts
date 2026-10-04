import { z } from 'zod';

import {
  VALIDATION_MESSAGES as MSG,
  emailSchema,
  isPasswordRelatedToEmail,
  passwordSchema,
  personNameSchema,
} from '@codex/shared';

import { isPasswordGuessable } from '@/utils/password-strength.js';

const DEFAULT_ADMIN_NAME = 'Codex Admin';

/** Human-readable hints for the CLI (the schemas speak in i18n keys). */
const HINTS: Partial<Record<string, string>> = {
  [MSG.REQUIRED]: 'is required',
  [MSG.INVALID_EMAIL]: 'must be a valid email address',
  [MSG.PASSWORD_TOO_SHORT]: 'must be at least 12 characters',
  [MSG.PASSWORD_WEAK]:
    'is too easy to guess: use a long passphrase or a generated password (openssl rand -base64 18)',
  [MSG.PASSWORD_CONTAINS_EMAIL]: 'must not contain the email name',
};

const seedEnvSchema = z
  .object({
    ADMIN_EMAIL: emailSchema,
    ADMIN_PASSWORD: passwordSchema,
    ADMIN_NAME: personNameSchema.default(DEFAULT_ADMIN_NAME),
  })
  .refine((env) => !isPasswordRelatedToEmail(env.ADMIN_PASSWORD, env.ADMIN_EMAIL), {
    error: MSG.PASSWORD_CONTAINS_EMAIL,
    path: ['ADMIN_PASSWORD'],
  })
  .refine((env) => !isPasswordGuessable(env.ADMIN_PASSWORD, [env.ADMIN_EMAIL, env.ADMIN_NAME]), {
    error: MSG.PASSWORD_WEAK,
    path: ['ADMIN_PASSWORD'],
  });

export type SeedEnv = z.infer<typeof seedEnvSchema>;

export class SeedEnvError extends Error {
  constructor(readonly issues: string[]) {
    super(`Refusing to seed:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'SeedEnvError';
  }
}

/** Validates the admin credentials; a weak password stops the seed before any write. */
export function parseSeedEnv(source: NodeJS.ProcessEnv): SeedEnv {
  const result = seedEnvSchema.safeParse(source);
  if (result.success) return result.data;

  throw new SeedEnvError(
    result.error.issues.map((issue) => {
      const field = issue.path.join('.');
      return `${field} ${HINTS[issue.message] ?? issue.message}`;
    }),
  );
}
