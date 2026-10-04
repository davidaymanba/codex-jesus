import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminPostDtoSchema,
  createPostSchema,
  localeQuerySchema,
  Permission,
  postDtoSchema,
  postQuerySchema,
  postSummaryDtoSchema,
  publicPostQuerySchema,
  slugParamsSchema,
  updatePostSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import {
  adminCrudPaths,
  publicListAndDetailPaths,
  publicRead,
} from '@/modules/docs/crud-openapi.js';
import { COMMON_ERRORS, errorResponse, successResponse } from '@/modules/docs/openapi-helpers.js';

const TAG = 'Posts';

export const postPaths: ZodOpenApiPathsObject = {
  ...publicListAndDetailPaths({
    tag: TAG,
    path: '/public/posts',
    listQuery: publicPostQuerySchema,
    summary: postSummaryDtoSchema,
    detail: postDtoSchema,
  }),
  [`${API_PREFIX}/public/posts/{slug}/related`]: {
    get: publicRead(TAG, {
      summary: 'Posts related to one post',
      description:
        'Up to 3 posts sharing a category or tag, newest first, topped up with the latest posts.',
      requestParams: { path: slugParamsSchema, query: localeQuerySchema },
      responses: {
        '200': successResponse('Related posts', z.array(postSummaryDtoSchema)),
        '404': errorResponse('No published post with this slug'),
        ...COMMON_ERRORS,
      },
    }),
  },
  ...adminCrudPaths({
    tag: TAG,
    path: '/admin/posts',
    permission: Permission.CONTENT_MANAGE,
    item: adminPostDtoSchema,
    listQuery: postQuerySchema,
    create: createPostSchema,
    update: updatePostSchema,
  }),
};
