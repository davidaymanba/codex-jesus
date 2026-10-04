import { z } from 'zod';

import { boundedInt, httpUrlSchema, objectSchema, requiredString } from './common.js';
import { createLocalizedStringSchema } from './localized-string.js';
import { createSortSchema, paginationSchema } from './pagination.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { MEDIA_LIMITS, MEDIA_MIME_TYPES } from '../constants/media.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';

const altTextSchema = createLocalizedStringSchema({ max: FIELD_LIMITS.ALT_TEXT_MAX });
const mimeTypeSchema = z.enum(MEDIA_MIME_TYPES, { error: MSG.INVALID_OPTION });
const dimensionSchema = boundedInt({ min: 1, max: MEDIA_LIMITS.MAX_DIMENSION_PX });

/** Metadata saved after a successful upload (the file itself is validated by magic bytes). */
export const createMediaSchema = objectSchema({
  url: httpUrlSchema,
  publicId: requiredString({ max: MEDIA_LIMITS.PUBLIC_ID_MAX }),
  alt: altTextSchema,
  width: dimensionSchema,
  height: dimensionSchema,
  mimeType: mimeTypeSchema,
  sizeBytes: boundedInt({ min: 1, max: MEDIA_LIMITS.MAX_BYTES }),
});

/**
 * Text fields sent with a multipart upload (`file` carries the image). Flat, because
 * multipart fields are strings.
 */
export const mediaUploadFieldsSchema = objectSchema({
  altAr: requiredString({ max: FIELD_LIMITS.ALT_TEXT_MAX }),
  altEn: requiredString({ max: FIELD_LIMITS.ALT_TEXT_MAX }),
});

/** Only the alt text is editable; the file is immutable once uploaded. */
export const updateMediaSchema = objectSchema({ alt: altTextSchema }).partial();

export const mediaQuerySchema = paginationSchema
  .extend({ mimeType: mimeTypeSchema.optional() })
  .extend(
    createSortSchema(['createdAt', 'sizeBytes'], { sortBy: 'createdAt', sortOrder: 'desc' }).shape,
  );

export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type MediaUploadFields = z.infer<typeof mediaUploadFieldsSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type MediaQuery = z.infer<typeof mediaQuerySchema>;
