import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminProjectDtoSchema,
  createProjectSchema,
  Permission,
  projectDtoSchema,
  projectQuerySchema,
  projectSummaryDtoSchema,
  publicProjectQuerySchema,
  updateProjectSchema,
} from '@codex/shared';

import {
  adminCrudPaths,
  adminReorderPath,
  publicListAndDetailPaths,
} from '@/modules/docs/crud-openapi.js';

const TAG = 'Projects';

export const projectPaths: ZodOpenApiPathsObject = {
  ...publicListAndDetailPaths({
    tag: TAG,
    path: '/public/projects',
    listQuery: publicProjectQuerySchema,
    summary: projectSummaryDtoSchema,
    detail: projectDtoSchema,
  }),
  ...adminReorderPath(TAG, '/admin/projects', Permission.CONTENT_MANAGE),
  ...adminCrudPaths({
    tag: TAG,
    path: '/admin/projects',
    permission: Permission.CONTENT_MANAGE,
    item: adminProjectDtoSchema,
    listQuery: projectQuerySchema,
    create: createProjectSchema,
    update: updateProjectSchema,
  }),
};
