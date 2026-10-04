import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** How soon a quote requester wants to start. */
export const ProjectTimeline = {
  ASAP: 'ASAP',
  ONE_TO_THREE_MONTHS: 'ONE_TO_THREE_MONTHS',
  THREE_TO_SIX_MONTHS: 'THREE_TO_SIX_MONTHS',
  FLEXIBLE: 'FLEXIBLE',
} as const;

export type ProjectTimeline = (typeof ProjectTimeline)[keyof typeof ProjectTimeline];

export const projectTimelineSchema = z.enum(ProjectTimeline, {
  error: VALIDATION_MESSAGES.INVALID_OPTION,
});
