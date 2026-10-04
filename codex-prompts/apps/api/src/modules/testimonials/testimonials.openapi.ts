import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminTestimonialDtoSchema,
  createTestimonialSchema,
  testimonialDtoSchema,
  Permission,
  paginationSchema,
  testimonialQuerySchema,
  updateTestimonialSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { adminCrudPaths, adminReorderPath, publicRead } from '@/modules/docs/crud-openapi.js';
import { COMMON_ERRORS, errorResponse, successResponse } from '@/modules/docs/openapi-helpers.js';

const TAG = 'Testimonials';

export const testimonialsPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/public/testimonials`]: {
    get: publicRead(TAG, {
      summary: 'Visible items in their arranged order',
      requestParams: { query: paginationSchema },
      responses: {
        '200': successResponse('A page of items', z.array(testimonialDtoSchema)),
        '400': errorResponse('Invalid query'),
        ...COMMON_ERRORS,
      },
    }),
  },
  ...adminReorderPath(TAG, '/admin/testimonials', Permission.CONTENT_MANAGE),
  ...adminCrudPaths({
    tag: TAG,
    path: '/admin/testimonials',
    permission: Permission.CONTENT_MANAGE,
    item: adminTestimonialDtoSchema,
    listQuery: testimonialQuerySchema,
    create: createTestimonialSchema,
    update: updateTestimonialSchema,
  }),
};
