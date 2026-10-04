import type { z } from 'zod';

import type {
  apiErrorSchema,
  paginationMetaSchema,
  validationIssueSchema,
} from '../schemas/api-response.js';

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;

/** Success envelope. Mirrors `createApiSuccessSchema` for a concrete data type. */
export interface ApiSuccess<TData> {
  success: true;
  data: TData;
  meta?: PaginationMeta;
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiError;
