import type { z } from 'zod';
import type { ZodOpenApiResponseObject } from 'zod-openapi';

import { apiErrorSchema, createApiSuccessSchema } from '@codex/shared';

const JSON_TYPE = 'application/json';

/** A 2xx response documented with the shared success envelope around `data`. */
export function successResponse(description: string, data: z.ZodType): ZodOpenApiResponseObject {
  return { description, content: { [JSON_TYPE]: { schema: createApiSuccessSchema(data) } } };
}

/** An error response documented with the shared error envelope. */
export function errorResponse(description: string): ZodOpenApiResponseObject {
  return { description, content: { [JSON_TYPE]: { schema: apiErrorSchema } } };
}

export function jsonBody(schema: z.ZodType) {
  return { required: true, content: { [JSON_TYPE]: { schema } } };
}

/** Responses every route can return (validation, rate limit, server error). */
export const COMMON_ERRORS = {
  '429': errorResponse('Rate limited (see Retry-After)'),
  '500': errorResponse('Unexpected error (generic message, no internals)'),
} as const;

/** Security requirement: the httpOnly access-token cookie set by /auth/login. */
export const COOKIE_AUTH = [{ accessTokenCookie: [] }];
/** Security requirement: access-token cookie plus the X-CSRF-Token header. */
export const COOKIE_AUTH_WITH_CSRF = [{ accessTokenCookie: [], csrfHeader: [] }];
