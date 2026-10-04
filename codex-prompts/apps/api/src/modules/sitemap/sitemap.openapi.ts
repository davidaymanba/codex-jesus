import type { ZodOpenApiPathsObject } from 'zod-openapi';

import { sitemapDataDtoSchema } from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { publicRead } from '@/modules/docs/crud-openapi.js';
import { COMMON_ERRORS, successResponse } from '@/modules/docs/openapi-helpers.js';

export const sitemapPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/public/sitemap-data`]: {
    get: publicRead('Sitemap', {
      summary: 'Published slugs and last-modified times for sitemap.xml',
      responses: { '200': successResponse('Sitemap data', sitemapDataDtoSchema), ...COMMON_ERRORS },
    }),
  },
};
