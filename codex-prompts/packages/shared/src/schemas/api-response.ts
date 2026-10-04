import { z } from 'zod';

import { ERROR_CODES } from '../constants/error-codes.js';

/** Pagination metadata attached to every list response. */
export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

/** One failed field in a `VALIDATION_FAILED` error: dotted path + i18n message key. */
export const validationIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
});

/**
 * Error body returned by the API for every non-2xx response. `message` is an i18n key;
 * `requestId` matches the `X-Request-Id` header and the server logs.
 */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    details: z.array(validationIssueSchema).optional(),
    requestId: z.string(),
  }),
});

/**
 * Builds the success envelope schema `{ success: true, data, meta? }` around a data schema.
 * Used by the web API client to validate responses in development.
 */
export function createApiSuccessSchema<TData extends z.ZodType>(dataSchema: TData) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: paginationMetaSchema.optional(),
  });
}
