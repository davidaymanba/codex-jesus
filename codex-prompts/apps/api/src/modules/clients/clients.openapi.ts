import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminClientDtoSchema,
  createClientSchema,
  clientDtoSchema,
  Permission,
  paginationSchema,
  clientQuerySchema,
  updateClientSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { adminCrudPaths, adminReorderPath, publicRead } from '@/modules/docs/crud-openapi.js';
import { COMMON_ERRORS, errorResponse, successResponse } from '@/modules/docs/openapi-helpers.js';

const TAG = 'Clients';

export const clientsPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/public/clients`]: {
    get: publicRead(TAG, {
      summary: 'Visible items in their arranged order',
      requestParams: { query: paginationSchema },
      responses: {
        '200': successResponse('A page of items', z.array(clientDtoSchema)),
        '400': errorResponse('Invalid query'),
        ...COMMON_ERRORS,
      },
    }),
  },
  ...adminReorderPath(TAG, '/admin/clients', Permission.CONTENT_MANAGE),
  ...adminCrudPaths({
    tag: TAG,
    path: '/admin/clients',
    permission: Permission.CONTENT_MANAGE,
    item: adminClientDtoSchema,
    listQuery: clientQuerySchema,
    create: createClientSchema,
    update: updateClientSchema,
  }),
};
