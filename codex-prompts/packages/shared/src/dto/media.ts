import { z } from 'zod';

import { mediaDtoSchema, timestampDtoSchema } from './common.js';
import { MEDIA_MIME_TYPES } from '../constants/media.js';
import { auditEntitySchema } from '../enums/audit-entity.js';

export const adminMediaDtoSchema = mediaDtoSchema.extend({
  publicId: z.string(),
  mimeType: z.enum(MEDIA_MIME_TYPES),
  sizeBytes: z.int(),
  uploadedById: z.uuid().nullable(),
  createdAt: timestampDtoSchema,
  updatedAt: timestampDtoSchema,
});

/** One place a media item is used; delete is refused while any exist. */
export const mediaUsageDtoSchema = z.object({
  entity: auditEntitySchema,
  id: z.string(),
  /** Why it is referenced, e.g. `cover`, `gallery`, `content`. */
  field: z.string(),
});

export type AdminMediaDto = z.infer<typeof adminMediaDtoSchema>;
export type MediaUsageDto = z.infer<typeof mediaUsageDtoSchema>;
