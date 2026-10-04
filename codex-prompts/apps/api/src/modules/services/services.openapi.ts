import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminServiceDtoSchema,
  createServiceSchema,
  paginationSchema,
  Permission,
  serviceDtoSchema,
  serviceQuerySchema,
  serviceSummaryDtoSchema,
  updateServiceSchema,
} from '@codex/shared';

import {
  adminCrudPaths,
  adminReorderPath,
  publicListAndDetailPaths,
} from '@/modules/docs/crud-openapi.js';

const TAG = 'Services';

export const servicePaths: ZodOpenApiPathsObject = {
  ...publicListAndDetailPaths({
    tag: TAG,
    path: '/public/services',
    listQuery: paginationSchema,
    summary: serviceSummaryDtoSchema,
    detail: serviceDtoSchema,
  }),
  ...adminReorderPath(TAG, '/admin/services', Permission.CONTENT_MANAGE),
  ...adminCrudPaths({
    tag: TAG,
    path: '/admin/services',
    permission: Permission.CONTENT_MANAGE,
    item: adminServiceDtoSchema,
    listQuery: serviceQuerySchema,
    create: createServiceSchema,
    update: updateServiceSchema,
  }),
};
