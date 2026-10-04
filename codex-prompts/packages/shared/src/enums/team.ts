import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** The three Codex teams. */
export const Team = {
  BRAND: 'BRAND',
  MARKETING: 'MARKETING',
  DEVELOPMENT: 'DEVELOPMENT',
} as const;

export type Team = (typeof Team)[keyof typeof Team];

export const teamSchema = z.enum(Team, { error: VALIDATION_MESSAGES.INVALID_OPTION });
