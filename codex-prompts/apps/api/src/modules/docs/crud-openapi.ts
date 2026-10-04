import { z } from 'zod';
import type { ZodOpenApiOperationObject, ZodOpenApiPathsObject } from 'zod-openapi';

import {
  idParamsSchema,
  localeQuerySchema,
  reorderResultDtoSchema,
  reorderSchema,
  slugParamsSchema,
  type Permission,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';

import {
  COMMON_ERRORS,
  COOKIE_AUTH,
  COOKIE_AUTH_WITH_CSRF,
  errorResponse,
  jsonBody,
  successResponse,
} from './openapi-helpers.js';

/** Errors every admin route can return, on top of `COMMON_ERRORS`. */
export const ADMIN_ERRORS = {
  '401': errorResponse('Not signed in'),
  '403': errorResponse('Missing permission, or missing / invalid CSRF token on writes'),
  ...COMMON_ERRORS,
} as const;

const idErrors = { '404': errorResponse('Not found'), ...ADMIN_ERRORS } as const;

export interface AdminCrudDocs {
  /** Swagger tag, e.g. `Categories`. */
  tag: string;
  /** Collection path under the API prefix, e.g. `/admin/categories`. */
  path: string;
  permission: Permission;
  item: z.ZodType;
  // Query parameters come from an object schema (each key is one parameter).
  listQuery: z.ZodType<unknown, Record<string, unknown>>;
  create: z.ZodType;
  update: z.ZodType;
}

/** A read operation of an admin collection. */
export function adminRead(
  tag: string,
  permission: Permission,
  operation: Omit<ZodOpenApiOperationObject, 'tags' | 'security'>,
): ZodOpenApiOperationObject {
  return {
    ...operation,
    tags: [tag],
    security: COOKIE_AUTH,
    description: [operation.description, `Requires \`${permission}\`.`].filter(Boolean).join(' '),
  };
}

/** A state-changing operation: also needs the CSRF header. */
export function adminWrite(
  tag: string,
  permission: Permission,
  operation: Omit<ZodOpenApiOperationObject, 'tags' | 'security'>,
): ZodOpenApiOperationObject {
  return { ...adminRead(tag, permission, operation), security: COOKIE_AUTH_WITH_CSRF };
}

/** List, create, read, update and delete operations of an admin collection. */
export function adminCrudPaths(docs: AdminCrudDocs): ZodOpenApiPathsObject {
  const { tag, permission, item } = docs;
  const collection = `${API_PREFIX}${docs.path}`;
  const path = { path: idParamsSchema };
  return {
    [collection]: {
      get: adminRead(tag, permission, {
        summary: `List ${tag.toLowerCase()}`,
        requestParams: { query: docs.listQuery },
        responses: {
          '200': successResponse('A page of items (meta holds the totals)', z.array(item)),
          '400': errorResponse('Invalid filters'),
          ...ADMIN_ERRORS,
        },
      }),
      post: adminWrite(tag, permission, {
        summary: `Create one of ${tag.toLowerCase()}`,
        requestBody: jsonBody(docs.create),
        responses: {
          '201': successResponse('Created', item),
          '400': errorResponse('Invalid input'),
          '409': errorResponse('A slug or unique value is taken, or a referenced id is missing'),
          ...ADMIN_ERRORS,
        },
      }),
    },
    [`${collection}/{id}`]: {
      get: adminRead(tag, permission, {
        summary: `Get one of ${tag.toLowerCase()}`,
        requestParams: path,
        responses: { '200': successResponse('The item', item), ...idErrors },
      }),
      patch: adminWrite(tag, permission, {
        summary: `Update one of ${tag.toLowerCase()} (only the fields sent)`,
        requestParams: path,
        requestBody: jsonBody(docs.update),
        responses: {
          '200': successResponse('Updated', item),
          '400': errorResponse('Invalid input'),
          '409': errorResponse('A slug or unique value is taken, or a referenced id is missing'),
          ...idErrors,
        },
      }),
      delete: adminWrite(tag, permission, {
        summary: `Delete one of ${tag.toLowerCase()}`,
        requestParams: path,
        responses: {
          '204': { description: 'Deleted' },
          '409': errorResponse('Still referenced by other content'),
          ...idErrors,
        },
      }),
    },
  };
}

/** A public, cached read (published content only). */
export function publicRead(
  tag: string,
  operation: Omit<ZodOpenApiOperationObject, 'tags'>,
): ZodOpenApiOperationObject {
  return {
    ...operation,
    tags: [tag],
    description: [
      operation.description,
      'Published content only. Cached (Redis, tag-invalidated); `Cache-Control: public, no-cache` with an ETag.',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

/** `PUT <collection>/reorder`: saves a hand-arranged order. */
export function adminReorderPath(
  tag: string,
  collectionPath: string,
  permission: Permission,
): ZodOpenApiPathsObject {
  return {
    [`${API_PREFIX}${collectionPath}/reorder`]: {
      put: adminWrite(tag, permission, {
        summary: `Reorder ${tag.toLowerCase()}`,
        description: 'Send every id, first to last; `order` becomes each position (0, 1, 2…).',
        requestBody: jsonBody(reorderSchema),
        responses: {
          '200': successResponse('Reordered', reorderResultDtoSchema),
          '400': errorResponse('Invalid input or an unknown id (nothing is changed)'),
          ...ADMIN_ERRORS,
        },
      }),
    },
  };
}

/** Public list + detail-by-slug reads of a content type. */
export function publicListAndDetailPaths(options: {
  tag: string;
  path: string;
  listQuery: z.ZodType<unknown, Record<string, unknown>>;
  summary: z.ZodType;
  detail: z.ZodType;
}): ZodOpenApiPathsObject {
  const { tag, path } = options;
  return {
    [`${API_PREFIX}${path}`]: {
      get: publicRead(tag, {
        summary: `List published ${tag.toLowerCase()}`,
        requestParams: { query: options.listQuery },
        responses: {
          '200': successResponse(
            'A page of items (meta holds the totals)',
            z.array(options.summary),
          ),
          '400': errorResponse('Invalid filters'),
          ...COMMON_ERRORS,
        },
      }),
    },
    [`${API_PREFIX}${path}/{slug}`]: {
      get: publicRead(tag, {
        summary: `One published item by slug`,
        description: '`locale` picks the slug column (`slugAr` or `slugEn`).',
        requestParams: { path: slugParamsSchema, query: localeQuerySchema },
        responses: {
          '200': successResponse('The item', options.detail),
          '404': errorResponse('No published item with this slug'),
          ...COMMON_ERRORS,
        },
      }),
    },
  };
}
