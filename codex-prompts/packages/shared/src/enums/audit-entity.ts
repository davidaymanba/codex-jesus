import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** Entities an audit log entry can refer to. */
export const AuditEntity = {
  USER: 'USER',
  SERVICE: 'SERVICE',
  PROJECT: 'PROJECT',
  POST: 'POST',
  CATEGORY: 'CATEGORY',
  TAG: 'TAG',
  TESTIMONIAL: 'TESTIMONIAL',
  TEAM_MEMBER: 'TEAM_MEMBER',
  CLIENT: 'CLIENT',
  MEDIA: 'MEDIA',
  QUOTE_REQUEST: 'QUOTE_REQUEST',
  CONTACT_MESSAGE: 'CONTACT_MESSAGE',
  SITE_SETTINGS: 'SITE_SETTINGS',
} as const;

export type AuditEntity = (typeof AuditEntity)[keyof typeof AuditEntity];

export const auditEntitySchema = z.enum(AuditEntity, { error: VALIDATION_MESSAGES.INVALID_OPTION });
