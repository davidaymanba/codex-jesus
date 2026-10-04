import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** Social networks supported in team and company profiles. */
export const SocialPlatform = {
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  X: 'X',
  LINKEDIN: 'LINKEDIN',
  TIKTOK: 'TIKTOK',
  SNAPCHAT: 'SNAPCHAT',
  YOUTUBE: 'YOUTUBE',
  BEHANCE: 'BEHANCE',
  DRIBBBLE: 'DRIBBBLE',
  GITHUB: 'GITHUB',
} as const;

export type SocialPlatform = (typeof SocialPlatform)[keyof typeof SocialPlatform];

export const socialPlatformSchema = z.enum(SocialPlatform, {
  error: VALIDATION_MESSAGES.INVALID_OPTION,
});
