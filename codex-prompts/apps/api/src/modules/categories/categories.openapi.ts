import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminCategoryDtoSchema,
  categoryDtoSchema,
  categoryQuerySchema,
  createCategorySchema,
  Permission,
  publicCategoryQuerySchema,
  updateCategorySchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { adminCrudPaths, publicRead } from '@/modules/docs/crud-openapi.js';
import { COMMON_ERRORS, errorResponse, successResponse } from '@/modules/docs/openapi-helpers.js';

const TAG = 'Categories';

export const categoryPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/public/categories`]: {
    get: publicRead(TAG, {
      summary: 'All categories, optionally of one type',
      requestParams: { query: publicCategoryQuerySchema },
      responses: {
        '200': successResponse('Categories', z.array(categoryDtoSchema)),
        '400': errorResponse('Invalid type'),
        ...COMMON_ERRORS,
      },
    }),
  },
  ...adminCrudPaths({
    tag: TAG,
    path: '/admin/categories',
    permission: Permission.CONTENT_MANAGE,
    item: adminCategoryDtoSchema,
    listQuery: categoryQuerySchema,
    create: createCategorySchema,
    update: updateCategorySchema,
  }),
};
